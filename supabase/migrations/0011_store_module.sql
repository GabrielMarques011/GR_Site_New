-- =============================================================================
-- Migration: 0011_store_module
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Módulo "Loja": segunda modalidade comercial (produtos de pronta entrega —
-- acessórios, papelaria etc.), vendida lado a lado com os produtos
-- personalizados sem se confundir com eles em nenhuma tela ou cálculo.
--
-- Em vez de duplicar `products`/`categories`, as duas tabelas ganham uma
-- coluna `kind` ('personalizado' | 'loja') — reaproveita 100% do CRUD,
-- imagens, opções/kits, promoções, carrinho, checkout e revalidação de preço
-- já existentes. Toda linha já cadastrada vira 'personalizado' (default),
-- nenhum produto/categoria atual muda de comportamento.
--
-- A baixa de estoque da Loja só acontece quando a administradora muda o
-- status de um pedido para 'concluido' em /administracao/pagamentos (isso já
-- é manual hoje) — reaproveita o ledger `stock_movements` já criado pela
-- migration 0009 (Compra de Materiais), só com um tipo novo ('saida') ao
-- lado de 'entrada'/'estorno'. Pedidos sem nenhum item 'loja' continuam
-- exatamente como hoje: `set_order_status` só mexe em estoque quando o
-- snapshot do item (`product_kind`) diz 'loja' — isso é gravado pela
-- aplicação em cada pedido novo a partir de agora, não existe nos pedidos já
-- gravados (que não têm item nenhum de loja de qualquer forma).
--
-- Kits/opções continuam com um único estoque físico por produto: o campo
-- `product_options.quantity` (já existente) passa a também significar
-- "quantas unidades-base esse pacote consome" — nenhuma coluna nova em
-- `product_options`.
--
-- Nada destrutivo: só `alter table ... add column ... default` (não some com
-- nenhum dado existente), uma função nova, e um valor novo em um `check` já
-- existente (recriado, não apaga os valores já gravados).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Segmentação: products.kind / categories.kind
-- -----------------------------------------------------------------------------
alter table public.products
  add column if not exists kind text not null default 'personalizado'
    check (kind in ('personalizado', 'loja'));

alter table public.categories
  add column if not exists kind text not null default 'personalizado'
    check (kind in ('personalizado', 'loja'));

create index if not exists products_kind_idx on public.products (kind);
create index if not exists categories_kind_idx on public.categories (kind);

-- -----------------------------------------------------------------------------
-- 2. stock_movements ganha o tipo 'saida' (venda confirmada), ao lado de
--    'entrada' (compra de materiais) e 'estorno' (cancelamento/reversão).
-- -----------------------------------------------------------------------------
alter table public.stock_movements
  drop constraint if exists stock_movements_type_check;

alter table public.stock_movements
  add constraint stock_movements_type_check
  check (type in ('entrada', 'estorno', 'saida'));

-- stock_movements.purchase_id referencia material_purchases — uma saída por
-- venda não tem "compra" associada, então a movimentação de venda referencia
-- o pedido através de uma coluna nova, só para consulta/auditoria.
alter table public.stock_movements
  add column if not exists order_id uuid references public.orders(id) on delete set null;

create index if not exists stock_movements_order_id_idx
  on public.stock_movements (order_id);

-- -----------------------------------------------------------------------------
-- 3. set_order_status: muda o status do pedido e, só quando o pedido tem
--    item(ns) da Loja com estoque controlado, aplica a baixa (ao entrar em
--    'concluido') ou o estorno (ao sair de 'concluido'), na mesma transação.
--    Pedidos 100% personalizados seguem exatamente como o `.update()` direto
--    de hoje — nenhuma validação nova se aplica a eles.
-- -----------------------------------------------------------------------------
create or replace function public.set_order_status(
  p_order_id uuid,
  p_new_status text,
  p_administrator_id uuid
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_current_status text;
  v_items jsonb;
  v_item jsonb;
  v_product_id uuid;
  v_product_kind text;
  v_quantity int;
  v_units_per_package int;
  v_units int;
  v_stock int;
  v_product_name text;
begin
  if p_new_status not in ('em_andamento', 'concluido', 'recusado') then
    raise exception 'Status inválido: %', p_new_status;
  end if;

  select status, items into v_current_status, v_items
  from public.orders where id = p_order_id;

  if v_current_status is null then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_current_status = p_new_status then
    return;
  end if;

  -- Entrando em "concluído": debita o estoque dos itens da Loja. Verifica
  -- TODOS os itens antes de debitar qualquer um (nunca debita parcialmente
  -- um pedido que será bloqueado por falta de estoque em outro item).
  if p_new_status = 'concluido' then
    for v_item in select * from jsonb_array_elements(v_items)
    loop
      if coalesce(v_item->>'product_kind', 'personalizado') <> 'loja' then
        continue;
      end if;

      v_product_id := (v_item->>'product_id')::uuid;
      v_quantity := (v_item->>'quantity')::int;
      v_units_per_package := coalesce((v_item->>'units_per_package')::int, 1);
      v_units := v_quantity * v_units_per_package;

      select stock_quantity, name into v_stock, v_product_name
      from public.products where id = v_product_id;

      if v_stock is not null and v_stock - v_units < 0 then
        raise exception
          'Estoque insuficiente para "%": disponível %, necessário %.',
          coalesce(v_product_name, v_item->>'name'), v_stock, v_units;
      end if;
    end loop;

    for v_item in select * from jsonb_array_elements(v_items)
    loop
      if coalesce(v_item->>'product_kind', 'personalizado') <> 'loja' then
        continue;
      end if;

      v_product_id := (v_item->>'product_id')::uuid;
      v_quantity := (v_item->>'quantity')::int;
      v_units_per_package := coalesce((v_item->>'units_per_package')::int, 1);
      v_units := v_quantity * v_units_per_package;

      update public.products
      set stock_quantity = stock_quantity - v_units
      where id = v_product_id and stock_quantity is not null;

      insert into public.stock_movements (
        product_id, product_name_snapshot, type, quantity,
        order_id, administrator_id
      ) values (
        v_product_id, v_item->>'name', 'saida', v_units,
        p_order_id, p_administrator_id
      );
    end loop;
  end if;

  -- Saindo de "concluído" (pedido voltou a em_andamento/recusado): estorna o
  -- estoque debitado antes.
  if v_current_status = 'concluido' and p_new_status <> 'concluido' then
    for v_item in select * from jsonb_array_elements(v_items)
    loop
      if coalesce(v_item->>'product_kind', 'personalizado') <> 'loja' then
        continue;
      end if;

      v_product_id := (v_item->>'product_id')::uuid;
      v_quantity := (v_item->>'quantity')::int;
      v_units_per_package := coalesce((v_item->>'units_per_package')::int, 1);
      v_units := v_quantity * v_units_per_package;

      update public.products
      set stock_quantity = stock_quantity + v_units
      where id = v_product_id and stock_quantity is not null;

      insert into public.stock_movements (
        product_id, product_name_snapshot, type, quantity,
        order_id, administrator_id
      ) values (
        v_product_id, v_item->>'name', 'estorno', v_units,
        p_order_id, p_administrator_id
      );
    end loop;
  end if;

  update public.orders
  set status = p_new_status
  where id = p_order_id;
end;
$$;

grant execute on function public.set_order_status(uuid, text, uuid) to authenticated;
