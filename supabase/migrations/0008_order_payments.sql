-- =============================================================================
-- Migration: 0008_order_payments
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Controle de pagamento por pedido, para a nova tela `/administracao/pagamentos`:
--   - `orders.payment_status`: todo pedido nasce "não pago" (`nao_pago`); a
--     administradora troca manualmente para "pago" quando identifica o
--     recebimento (nenhuma integração de pagamento — é um controle manual,
--     como o resto do projeto).
--   - `order_charge_logs`: registra que uma mensagem de cobrança foi
--     *preparada* (link do WhatsApp aberto) e, depois, que a administradora
--     *confirmou manualmente* que enviou — mesmo padrão de
--     `whatsapp_message_logs` (migration 0004_customers.sql): o sistema nunca
--     sabe sozinho se a cobrança foi enviada de verdade. Fica ligado a
--     `orders` (não a `customers`), porque um pedido pode não ter cliente
--     reconhecido (`orders.customer_id` nulo) e mesmo assim precisa poder
--     ser cobrado pelo telefone informado no checkout.
--
-- Nada destrutivo: só adiciona colunas/tabela novas. A policy de UPDATE que
-- já existe em `orders` (`orders_admin_update`, migration 0002_orders.sql)
-- já cobre as colunas novas — não precisa de policy adicional ali.
-- =============================================================================

alter table public.orders
  add column if not exists payment_status text not null default 'nao_pago'
    check (payment_status in ('nao_pago', 'pago'));

alter table public.orders
  add column if not exists payment_confirmed_at timestamptz;

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create table if not exists public.order_charge_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null default 'preparada'
    check (status in ('preparada', 'enviada_manualmente', 'cancelada')),
  prepared_at timestamptz not null default now(),
  manually_confirmed_at timestamptz,
  administrator_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_charge_logs_order_id_idx
  on public.order_charge_logs (order_id);

alter table public.order_charge_logs enable row level security;

-- order_charge_logs: só administradoras (preparar/confirmar/cancelar) —
-- mesmo padrão de whatsapp_message_logs.
create policy "order_charge_logs_admin_all"
  on public.order_charge_logs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
