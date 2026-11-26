-- =============================================================================
-- Migration: 0006_admin_create_customer
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Permite que a administradora cadastre um cliente diretamente pelo painel
-- (`/administracao/clientes/novo`) — para quando atende alguém pessoalmente
-- (cliente mais velha, ou que simplesmente ainda não criou o próprio
-- cadastro no site).
--
-- Diferente de `register_customer()` (migration 0004_customers.sql), esta
-- função NÃO cria sessão de dispositivo — quem está cadastrando é a
-- administradora, não a cliente, então não existe "este aparelho" para
-- reconhecer. O código de recuperação ainda é gerado, para a
-- administradora repassar à cliente depois (ela usa "Já sou cliente GR
-- Design" com telefone + código no próprio aparelho, quando quiser).
--
-- Mesmo padrão já usado em todo o resto do projeto: SECURITY DEFINER com
-- `search_path` travado, e aqui com uma checagem explícita de
-- `is_admin()` dentro da função (a tabela `customers` não tem policy de
-- INSERT para `authenticated`, de propósito — todo cadastro passa por
-- uma função, nunca INSERT direto).
--
-- Como rodar:
--   1. Leia o script inteiro antes de aplicar.
--   2. Rode no SQL Editor do Supabase (ou via `supabase db push`).
--   3. Não apaga nem altera nenhum dado existente — só cria uma função
--      nova.
-- =============================================================================

create or replace function public.admin_create_customer(
  p_full_name text,
  p_phone text,
  p_phone_normalized text,
  p_birth_date date,
  p_zip_code text,
  p_street text,
  p_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_state text,
  p_whatsapp_opt_in boolean,
  p_consent_version text,
  p_recovery_code_hash text
)
returns table (customer_id uuid, full_name text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradoras podem cadastrar clientes por aqui.';
  end if;

  if exists (
    select 1 from public.customers c
    where c.phone_normalized = p_phone_normalized
  ) then
    raise exception 'Já existe um cadastro com este telefone.' using errcode = 'unique_violation';
  end if;

  insert into public.customers (
    full_name, phone, phone_normalized, birth_date,
    zip_code, street, number, complement, neighborhood, city, state,
    whatsapp_marketing_opt_in, consent_date, consent_version
  ) values (
    p_full_name, p_phone, p_phone_normalized, p_birth_date,
    p_zip_code, p_street, p_number, p_complement, p_neighborhood, p_city, p_state,
    p_whatsapp_opt_in,
    case when p_whatsapp_opt_in then now() else null end,
    case when p_whatsapp_opt_in then p_consent_version else null end
  )
  returning id into v_customer_id;

  insert into public.customer_benefits (customer_id, benefit_type, discount_percentage, status)
  values (v_customer_id, 'primeira_compra', 5, 'disponivel');

  insert into public.customer_recovery_codes (customer_id, code_hash)
  values (v_customer_id, p_recovery_code_hash);

  return query select v_customer_id, p_full_name;
end;
$$;

grant execute on function public.admin_create_customer(
  text, text, text, date, text, text, text, text, text, text, text,
  boolean, text, text
) to authenticated;
