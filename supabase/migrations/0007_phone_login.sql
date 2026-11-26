-- =============================================================================
-- Migration: 0007_phone_login
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Simplifica o reconhecimento em outro aparelho: em vez de um código de
-- recuperação (julgado impraticável — longo, fácil de perder/esquecer),
-- o cliente "entra" só com o WhatsApp já cadastrado. Se existir um
-- cadastro com aquele telefone, reconhece na hora; se não existir, avisa
-- que não há cadastro.
--
-- ATENÇÃO — troca deliberada de segurança por simplicidade, pedida
-- explicitamente: qualquer pessoa que souber o WhatsApp de alguém passa a
-- conseguir "entrar" como essa pessoa em qualquer aparelho (ver endereço,
-- data de nascimento, usar o desconto de primeira compra dela). Não há
-- mais nenhuma verificação de posse do número. Ver SECURITY.md.
--
-- O código de recuperação (`customer_recovery_codes`,
-- `recover_customer_session()`, `rotate_recovery_code()`, migration
-- 0004_customers.sql) para de ser usado pela aplicação a partir daqui,
-- mas a tabela e as funções antigas não são apagadas (nada destrutivo) —
-- só ficam sem uso.
--
-- Como rodar:
--   1. Leia o script inteiro antes de aplicar.
--   2. Rode no SQL Editor do Supabase (ou via `supabase db push`).
--   3. Não apaga nenhum dado. Recria `register_customer()` e
--      `admin_create_customer()` com uma assinatura menor (sem o
--      parâmetro do código de recuperação) — por isso o `drop function`
--      das assinaturas antigas antes de recriar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- login_customer_by_phone: localiza o cadastro pelo telefone e cria uma
-- sessão nova. Devolve vazio (nenhuma linha) se não existir cadastro com
-- esse telefone — a aplicação trata isso como "cadastro não encontrado".
-- -----------------------------------------------------------------------------
create or replace function public.login_customer_by_phone(
  p_phone_normalized text,
  p_session_token_hash text,
  p_session_expires_at timestamptz
)
returns table (customer_id uuid, full_name text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
begin
  select c.id into v_customer_id
  from public.customers c
  where c.phone_normalized = p_phone_normalized;

  if v_customer_id is null then
    return;
  end if;

  insert into public.customer_sessions (customer_id, token_hash, expires_at)
  values (v_customer_id, p_session_token_hash, p_session_expires_at);

  return query
  select c.id, c.full_name from public.customers c where c.id = v_customer_id;
end;
$$;

grant execute on function public.login_customer_by_phone(text, text, timestamptz)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- register_customer: mesma função da migration 0004, só sem o parâmetro
-- e o INSERT do código de recuperação.
-- -----------------------------------------------------------------------------
drop function if exists public.register_customer(
  text, text, text, date, text, text, text, text, text, text, text,
  boolean, text, text, timestamptz, text
);

create or replace function public.register_customer(
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
  p_session_token_hash text,
  p_session_expires_at timestamptz
)
returns table (customer_id uuid, full_name text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
begin
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

  insert into public.customer_sessions (customer_id, token_hash, expires_at)
  values (v_customer_id, p_session_token_hash, p_session_expires_at);

  return query select v_customer_id, p_full_name;
end;
$$;

grant execute on function public.register_customer(
  text, text, text, date, text, text, text, text, text, text, text,
  boolean, text, text, timestamptz
) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- admin_create_customer: mesma função da migration 0006, só sem o
-- parâmetro e o INSERT do código de recuperação.
-- -----------------------------------------------------------------------------
drop function if exists public.admin_create_customer(
  text, text, text, date, text, text, text, text, text, text, text,
  boolean, text, text
);

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
  p_consent_version text
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

  return query select v_customer_id, p_full_name;
end;
$$;

grant execute on function public.admin_create_customer(
  text, text, text, date, text, text, text, text, text, text, text,
  boolean, text
) to authenticated;
