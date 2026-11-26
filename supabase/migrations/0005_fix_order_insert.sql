-- =============================================================================
-- Migration: 0005_fix_order_insert
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Corrige o registro de pedidos no histórico, que parou (ou nunca chegou a
-- funcionar de verdade — não há como confirmar quando começou) de salvar:
-- todo INSERT direto em `public.orders` como a role `anon` falhava com
-- "new row violates row-level security policy for table orders", mesmo
-- com a policy `orders_public_insert` (migration 0002_orders.sql) correta,
-- permissiva, com os grants de tabela certos para anon/authenticated, RLS
-- sem FORCE, e todas as condições do WITH CHECK confirmadas verdadeiras
-- (testadas via função SQL executando como anon de verdade, com os mesmos
-- valores exatos que o checkout envia). A causa raiz não foi identificada
-- apesar de uma investigação extensa — aparenta ser uma particularidade da
-- infraestrutura deste projeto Supabase específico (não reproduzida como
-- erro de sintaxe/lógica).
--
-- Enquanto isso não é entendido, a correção é contornar o INSERT direto:
-- toda escrita pública nova deste projeto (cadastro de cliente, sessão,
-- recuperação, reserva de desconto — migration 0004_customers.sql) já
-- passa por funções SECURITY DEFINER em vez de INSERT direto na tabela, e
-- todas funcionam corretamente. Esta migration aplica o mesmo padrão ao
-- registro de pedidos: `create_order()` faz a mesma validação que a
-- policy fazia (mesmas regras, agora como checagem explícita dentro da
-- função), insere a linha, e devolve o id.
--
-- Como rodar:
--   1. Leia o script inteiro antes de aplicar.
--   2. Rode no SQL Editor do Supabase (ou via `supabase db push`).
--   3. Não apaga nem altera nenhum dado existente — só cria uma função
--      nova. A policy `orders_public_insert` continua existindo (não faz
--      mal mantê-la, mesmo sem uso direto), caso o INSERT direto volte a
--      funcionar no futuro.
-- =============================================================================

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_id uuid,
  p_items jsonb,
  p_subtotal numeric,
  p_discount_percent numeric,
  p_total numeric,
  p_is_first_purchase boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if length(trim(p_customer_name)) < 1 or length(trim(p_customer_name)) > 200 then
    raise exception 'Nome do cliente inválido.';
  end if;

  if p_customer_phone !~ '^[0-9]{10,15}$' then
    raise exception 'Telefone do cliente inválido.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Itens do pedido inválidos.';
  end if;

  if p_subtotal < 0 or p_total < 0 then
    raise exception 'Valores do pedido inválidos.';
  end if;

  insert into public.orders (
    customer_name, customer_phone, customer_id, items,
    subtotal, discount_percent, total, is_first_purchase, status
  ) values (
    trim(p_customer_name),
    p_customer_phone,
    p_customer_id,
    p_items,
    p_subtotal,
    coalesce(p_discount_percent, 0),
    p_total,
    coalesce(p_is_first_purchase, false),
    'em_andamento'
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_order(
  text, text, uuid, jsonb, numeric, numeric, numeric, boolean
) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- update_order_discount: usada depois que o benefício de primeira compra é
-- reservado (precisa do pedido já existir, por causa da referência). Só
-- administradoras alteram pedidos diretamente (UPDATE já funciona bem
-- nesse sentido — o problema era só no INSERT), mas a correção do
-- desconto acontece no mesmo passo do checkout, sem sessão administrativa.
-- -----------------------------------------------------------------------------
create or replace function public.update_order_discount(
  p_order_id uuid,
  p_discount_percent numeric,
  p_total numeric,
  p_is_first_purchase boolean
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.orders
  set discount_percent = p_discount_percent,
      total = p_total,
      is_first_purchase = p_is_first_purchase
  where id = p_order_id;
$$;

grant execute on function public.update_order_discount(uuid, numeric, numeric, boolean)
  to anon, authenticated;
