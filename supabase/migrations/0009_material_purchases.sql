-- =============================================================================
-- Migration: 0009_material_purchases
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Módulo "Compra de Materiais" (`/administracao/compras`): registra compras
-- de materiais/produtos feitas pela loja, com vários itens por compra,
-- fornecedor, comprovante anexado e atualização automática do estoque
-- (`products.stock_quantity`).
--
-- Tabelas novas:
--   - `suppliers` — fornecedores, cadastro mínimo (nome). Criado rápido pela
--     própria tela de compras, sem precisar de uma tela dedicada.
--   - `material_purchases` — o registro principal da compra (categoria
--     livre, fornecedor, comprovante, total, quem registrou, quando).
--   - `material_purchase_items` — os itens da compra (produto, quantidade,
--     valor unitário, subtotal). Um produto pode ser criado na hora
--     (`products`, tabela já existente — nada muda nela).
--   - `stock_movements` — ledger de entradas/estornos de estoque, para
--     auditoria (qual compra gerou qual movimentação).
--
-- Consistência do estoque: supabase-js não tem transação multi-tabela pelo
-- REST, então criar uma compra (linha principal + itens + soma no estoque de
-- cada produto) só é atômico se tudo rodar dentro de uma única função
-- Postgres (uma chamada = uma transação). Por isso `create_material_purchase`,
-- `update_material_purchase` e `cancel_material_purchase` fazem tudo isso
-- internamente, nunca em múltiplos passos separados a partir do código.
-- Não precisam de `SECURITY DEFINER` (quem chama já é uma admin autenticada,
-- coberta pelas policies abaixo) — travam `search_path` mesmo assim, por
-- consistência com o resto do projeto.
--
-- Comprovante: bucket de Storage NOVO e PRIVADO (`purchase-receipts`,
-- `public = false`) — diferente do `products-images` (público), porque nota
-- fiscal/comprovante é documento sensível. Leitura só por URL assinada
-- (`createSignedUrl`, gerada no servidor), nunca por URL pública direta.
--
-- Nada destrutivo: só cria tabelas, função e bucket novos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. suppliers
-- -----------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. material_purchases
-- -----------------------------------------------------------------------------
create table if not exists public.material_purchases (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name_snapshot text not null,
  total_value numeric(10, 2) not null default 0,
  receipt_path text,
  status text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  administrator_id uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_purchases_created_at_idx
  on public.material_purchases (created_at desc);
create index if not exists material_purchases_supplier_id_idx
  on public.material_purchases (supplier_id);

-- -----------------------------------------------------------------------------
-- 3. material_purchase_items
-- -----------------------------------------------------------------------------
create table if not exists public.material_purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.material_purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  subtotal numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists material_purchase_items_purchase_id_idx
  on public.material_purchase_items (purchase_id);
create index if not exists material_purchase_items_product_id_idx
  on public.material_purchase_items (product_id);

-- -----------------------------------------------------------------------------
-- 4. stock_movements — ledger de entradas/estornos, para auditoria
-- -----------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  type text not null check (type in ('entrada', 'estorno')),
  quantity integer not null check (quantity > 0),
  purchase_id uuid references public.material_purchases(id) on delete set null,
  administrator_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_id_idx
  on public.stock_movements (product_id);
create index if not exists stock_movements_purchase_id_idx
  on public.stock_movements (purchase_id);

-- =============================================================================
-- RLS — tudo aqui é 100% administrativo, sem nenhum acesso público.
-- =============================================================================
alter table public.suppliers enable row level security;
alter table public.material_purchases enable row level security;
alter table public.material_purchase_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "suppliers_admin_all"
  on public.suppliers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "material_purchases_admin_all"
  on public.material_purchases for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "material_purchase_items_admin_all"
  on public.material_purchase_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "stock_movements_admin_all"
  on public.stock_movements for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- Storage: bucket privado para comprovantes
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('purchase-receipts', 'purchase-receipts', false)
on conflict (id) do nothing;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'purchase_receipts_%'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "purchase_receipts_admin_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'purchase-receipts' and public.is_admin());

create policy "purchase_receipts_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'purchase-receipts'
    and name like 'receipts/%'
    and public.is_admin()
  );

create policy "purchase_receipts_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'purchase-receipts' and public.is_admin())
  with check (bucket_id = 'purchase-receipts' and public.is_admin());

create policy "purchase_receipts_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'purchase-receipts' and public.is_admin());

-- =============================================================================
-- Funções — criar/editar/cancelar compra, sempre atualizando o estoque do
-- produto na mesma transação (nunca em passos separados).
-- =============================================================================

-- p_items: jsonb array de
--   {"product_id": uuid, "product_name": text, "quantity": int, "unit_price": numeric}
create or replace function public.create_material_purchase(
  p_category text,
  p_supplier_id uuid,
  p_supplier_name text,
  p_items jsonb,
  p_receipt_path text,
  p_administrator_id uuid
)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_purchase_id uuid;
  v_item jsonb;
  v_total numeric(10, 2) := 0;
  v_product_id uuid;
  v_quantity int;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2);
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'A compra precisa ter pelo menos um item.';
  end if;

  insert into public.material_purchases (
    category, supplier_id, supplier_name_snapshot, total_value,
    receipt_path, administrator_id
  ) values (
    p_category, p_supplier_id, p_supplier_name, 0,
    p_receipt_path, p_administrator_id
  )
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_unit_price := (v_item->>'unit_price')::numeric(10, 2);

    if v_quantity <= 0 then
      raise exception 'Quantidade do item precisa ser maior que zero.';
    end if;

    v_subtotal := v_quantity * v_unit_price;
    v_total := v_total + v_subtotal;

    insert into public.material_purchase_items (
      purchase_id, product_id, product_name_snapshot,
      quantity, unit_price, subtotal
    ) values (
      v_purchase_id, v_product_id, v_item->>'product_name',
      v_quantity, v_unit_price, v_subtotal
    );

    update public.products
    set stock_quantity = coalesce(stock_quantity, 0) + v_quantity
    where id = v_product_id;

    insert into public.stock_movements (
      product_id, product_name_snapshot, type, quantity,
      purchase_id, administrator_id
    ) values (
      v_product_id, v_item->>'product_name', 'entrada', v_quantity,
      v_purchase_id, p_administrator_id
    );
  end loop;

  update public.material_purchases
  set total_value = v_total, updated_at = now()
  where id = v_purchase_id;

  return v_purchase_id;
end;
$$;

grant execute on function public.create_material_purchase(
  text, uuid, text, jsonb, text, uuid
) to authenticated;

-- Substitui todos os itens de uma compra já existente pelos itens novos,
-- aplicando no estoque só a DIFERENÇA entre a quantidade antiga e a nova de
-- cada produto (nunca soma a quantidade nova inteira de novo). Produtos que
-- saíram da lista devolvem a quantidade antiga; produtos novos na lista
-- entram com a quantidade cheia.
create or replace function public.update_material_purchase(
  p_purchase_id uuid,
  p_category text,
  p_supplier_id uuid,
  p_supplier_name text,
  p_items jsonb,
  p_receipt_path text
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_old_item record;
  v_item jsonb;
  v_total numeric(10, 2) := 0;
  v_product_id uuid;
  v_quantity int;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2);
  v_delta int;
  v_old_quantities jsonb := '{}'::jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'A compra precisa ter pelo menos um item.';
  end if;

  if not exists (
    select 1 from public.material_purchases
    where id = p_purchase_id and status = 'ativa'
  ) then
    raise exception 'Só é possível editar uma compra ativa.';
  end if;

  -- Reverte todo o estoque que esta compra havia somado, para recalcular do
  -- zero a partir da lista nova de itens (evita duplicar ou perder deltas
  -- quando um produto some da lista ou muda mais de uma vez).
  for v_old_item in
    select product_id, quantity from public.material_purchase_items
    where purchase_id = p_purchase_id
  loop
    if v_old_item.product_id is not null then
      update public.products
      set stock_quantity = coalesce(stock_quantity, 0) - v_old_item.quantity
      where id = v_old_item.product_id;
    end if;
  end loop;

  delete from public.material_purchase_items where purchase_id = p_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::int;
    v_unit_price := (v_item->>'unit_price')::numeric(10, 2);

    if v_quantity <= 0 then
      raise exception 'Quantidade do item precisa ser maior que zero.';
    end if;

    v_subtotal := v_quantity * v_unit_price;
    v_total := v_total + v_subtotal;

    insert into public.material_purchase_items (
      purchase_id, product_id, product_name_snapshot,
      quantity, unit_price, subtotal
    ) values (
      p_purchase_id, v_product_id, v_item->>'product_name',
      v_quantity, v_unit_price, v_subtotal
    );

    update public.products
    set stock_quantity = coalesce(stock_quantity, 0) + v_quantity
    where id = v_product_id;
  end loop;

  update public.material_purchases
  set category = p_category,
      supplier_id = p_supplier_id,
      supplier_name_snapshot = p_supplier_name,
      total_value = v_total,
      receipt_path = coalesce(p_receipt_path, receipt_path),
      updated_at = now()
  where id = p_purchase_id;
end;
$$;

grant execute on function public.update_material_purchase(
  uuid, text, uuid, text, jsonb, text
) to authenticated;

-- Cancela (estorna) uma compra: reverte a quantidade de cada item do
-- estoque do respectivo produto. Bloqueia se algum produto ficaria com
-- estoque negativo (parte do material já foi usada/vendida).
create or replace function public.cancel_material_purchase(
  p_purchase_id uuid,
  p_administrator_id uuid
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_item record;
  v_current_stock int;
begin
  if not exists (
    select 1 from public.material_purchases
    where id = p_purchase_id and status = 'ativa'
  ) then
    raise exception 'Essa compra já está cancelada.';
  end if;

  for v_item in
    select product_id, product_name_snapshot, quantity
    from public.material_purchase_items
    where purchase_id = p_purchase_id and product_id is not null
  loop
    select stock_quantity into v_current_stock
    from public.products where id = v_item.product_id;

    if v_current_stock is not null and v_current_stock - v_item.quantity < 0 then
      raise exception
        'Não é possível estornar: % já tem parte do estoque usado (estoque atual: %, seria necessário reverter: %).',
        v_item.product_name_snapshot, v_current_stock, v_item.quantity;
    end if;

    update public.products
    set stock_quantity = coalesce(stock_quantity, 0) - v_item.quantity
    where id = v_item.product_id;

    insert into public.stock_movements (
      product_id, product_name_snapshot, type, quantity,
      purchase_id, administrator_id
    ) values (
      v_item.product_id, v_item.product_name_snapshot, 'estorno', v_item.quantity,
      p_purchase_id, p_administrator_id
    );
  end loop;

  update public.material_purchases
  set status = 'cancelada',
      cancelled_at = now(),
      cancelled_by = p_administrator_id,
      updated_at = now()
  where id = p_purchase_id;
end;
$$;

grant execute on function public.cancel_material_purchase(uuid, uuid) to authenticated;
