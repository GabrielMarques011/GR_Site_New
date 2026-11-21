-- =============================================================================
-- Migration: 0002_orders
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Cria a tabela `orders`, que passa a registrar cada pedido finalizado pelo
-- WhatsApp na loja (nome, telefone, itens, total, status) — a base da nova
-- página "Histórico" no painel e do desconto de 5% na primeira compra.
--
-- Como rodar:
--   1. Leia o script inteiro antes de aplicar.
--   2. Rode no SQL Editor do Supabase (ou via `supabase db push`).
--   3. Não apaga nem altera nenhuma tabela existente — só cria coisas novas.
--
-- Reaproveita o padrão já usado no projeto: `public.set_updated_at()` para
-- o timestamp de atualização, e uma função SECURITY DEFINER (nos moldes de
-- `is_admin()`) para a única consulta que o visitante precisa fazer sem
-- virar administrador: "esse telefone já pediu antes?".
-- =============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  discount_percent numeric(4, 2) not null default 0,
  total numeric(10, 2) not null,
  is_first_purchase boolean not null default false,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluido', 'recusado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Acelera "quantos pedidos esse telefone já fez" (usado pela função abaixo
-- e pela contagem de pedidos por cliente no painel).
create index if not exists orders_customer_phone_idx
  on public.orders (customer_phone);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;
end $$;

-- Qualquer visitante pode registrar um pedido (é o próprio ato de
-- finalizar pelo WhatsApp) — mas só com um formato minimamente válido, e
-- sempre começando como "em_andamento" (ninguém de fora decide o status).
create policy "orders_public_insert"
  on public.orders for insert
  to anon, authenticated
  with check (
    length(trim(customer_name)) between 1 and 200
    and customer_phone ~ '^[0-9]{10,15}$'
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) > 0
    and subtotal >= 0
    and total >= 0
    and status = 'em_andamento'
  );

-- Ninguém de fora pode LER a tabela (nomes/telefones de clientes não são
-- públicos) — só administradoras.
create policy "orders_admin_select"
  on public.orders for select
  to authenticated
  using (public.is_admin());

create policy "orders_admin_update"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "orders_admin_delete"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Função pública (sem exigir login) que só responde "quantos pedidos esse
-- telefone já tem" — nunca os dados de ninguém. Usada para: (a) decidir se
-- o cliente ganha os 5% de primeira compra, e (b) no formulário do
-- carrinho, antes de enviar.
-- -----------------------------------------------------------------------------
create or replace function public.count_orders_by_phone(p_phone text)
returns integer
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select count(*)::integer
  from public.orders
  where customer_phone = p_phone;
$$;

grant execute on function public.count_orders_by_phone(text) to anon, authenticated;
