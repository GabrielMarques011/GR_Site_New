-- =============================================================================
-- Migration: 0004_customers
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Cria o sistema de cadastro e reconhecimento de clientes: cadastro simples
-- (sem login/senha/e-mail), sessão persistente por dispositivo (cookie +
-- hash de token), recuperação em outro dispositivo por telefone + código,
-- benefício de 5% na primeira compra (com reserva/confirmação transacional)
-- e registro manual de mensagens de WhatsApp preparadas pelo painel.
--
-- Como rodar:
--   1. Leia o script inteiro antes de aplicar.
--   2. Rode no SQL Editor do Supabase (ou via `supabase db push`).
--   3. Não apaga nem altera nenhuma tabela existente — só cria tabelas
--      novas e uma coluna nova em `orders` (customer_id, nasce nula).
--
-- Reaproveita os padrões já usados no projeto: `public.set_updated_at()`
-- para timestamps de atualização, e funções SECURITY DEFINER (nos moldes
-- de `is_admin()`/`count_orders_by_phone()`) para as únicas operações que
-- o visitante precisa fazer sem se tornar administrador: cadastrar-se,
-- recuperar sua sessão em outro aparelho e reservar o desconto de primeira
-- compra. Nenhuma dessas funções expõe dados de um cliente para outro —
-- todas operam sobre um único registro por vez, localizado por token de
-- sessão (hash) ou por telefone + código de recuperação (hash).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. customers — cadastro simples (sem Supabase Auth, sem senha/e-mail/CPF).
-- -----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  phone_normalized text not null unique,
  birth_date date not null,
  zip_code text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  whatsapp_marketing_opt_in boolean not null default false,
  consent_date timestamptz,
  consent_version text,
  first_purchase_discount_used boolean not null default false,
  first_purchase_discount_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_birth_date_idx on public.customers (birth_date);
create index if not exists customers_created_at_idx on public.customers (created_at desc);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- View com mês/dia do aniversário extraídos, para filtrar "aniversariantes
-- do mês/dia" sem precisar carregar todos os clientes no navegador.
-- `security_invoker` garante que a RLS de `customers` continue valendo
-- (a view não herda privilégios de quem a criou).
create or replace view public.customers_with_birthday
  with (security_invoker = true)
as
select
  c.*,
  extract(month from c.birth_date)::int as birth_month,
  extract(day from c.birth_date)::int as birth_day
from public.customers c;

-- -----------------------------------------------------------------------------
-- 2. customer_sessions — reconhecimento persistente por dispositivo.
--    Só o HASH do token fica aqui; o token em si só existe no cookie
--    HttpOnly do navegador do cliente.
-- -----------------------------------------------------------------------------
create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists customer_sessions_customer_id_idx
  on public.customer_sessions (customer_id);

-- -----------------------------------------------------------------------------
-- 3. customer_recovery_codes — recuperação de cadastro em outro dispositivo
--    (telefone + código, sem envio automático — o código é mostrado uma vez
--    na tela logo após o cadastro, para o próprio cliente guardar).
-- -----------------------------------------------------------------------------
create table if not exists public.customer_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  code_hash text not null,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists customer_recovery_codes_customer_id_idx
  on public.customer_recovery_codes (customer_id);

-- -----------------------------------------------------------------------------
-- 4. customer_benefits — benefício de primeira compra (5%), com reserva
--    transacional para nunca ser usado duas vezes. `order_reference` aponta
--    para o pedido (tabela `orders`, já existente) ao qual o benefício foi
--    reservado.
-- -----------------------------------------------------------------------------
create table if not exists public.customer_benefits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  benefit_type text not null default 'primeira_compra',
  discount_percentage numeric(4, 2) not null default 5,
  status text not null default 'disponivel'
    check (status in ('disponivel', 'reservado', 'utilizado', 'cancelado')),
  order_reference uuid references public.orders(id) on delete set null,
  reserved_at timestamptz,
  used_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, benefit_type)
);

create index if not exists customer_benefits_status_idx
  on public.customer_benefits (status);

drop trigger if exists customer_benefits_set_updated_at on public.customer_benefits;
create trigger customer_benefits_set_updated_at
  before update on public.customer_benefits
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. whatsapp_message_templates — modelos editáveis (boas-vindas,
--    aniversário, primeira compra) com variáveis {nome}/{telefone}/
--    {data_nascimento}. Mensagem personalizada (por cliente) não usa
--    modelo — é digitada livremente no painel.
-- -----------------------------------------------------------------------------
create table if not exists public.whatsapp_message_templates (
  message_type text primary key
    check (message_type in ('boas_vindas', 'aniversario', 'primeira_compra')),
  content text not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists whatsapp_message_templates_set_updated_at on public.whatsapp_message_templates;
create trigger whatsapp_message_templates_set_updated_at
  before update on public.whatsapp_message_templates
  for each row execute function public.set_updated_at();

insert into public.whatsapp_message_templates (message_type, content) values
  ('boas_vindas',
   'Olá, {nome}! 💜' || E'\n\n' ||
   'Seja muito bem-vindo(a) à GR Design!' || E'\n\n' ||
   'Agradecemos por fazer parte da nossa família. Estamos à disposição para transformar suas ideias em presentes e personalizados especiais!'),
  ('aniversario',
   'Olá, {nome}! 🎉💜' || E'\n\n' ||
   'Hoje é um dia muito especial e a GR Design não poderia deixar de te desejar um feliz aniversário!' || E'\n\n' ||
   'Que seu novo ciclo seja repleto de alegria, conquistas e momentos especiais.' || E'\n\n' ||
   'Aproveite seu dia! Conte sempre com a GR Design para transformar suas ideias em presentes e personalizados únicos! 🎁💜'),
  ('primeira_compra',
   'Olá, {nome}! 💜' || E'\n\n' ||
   'Temos uma surpresa especial para você!' || E'\n\n' ||
   'Você tem direito a 5% de desconto na sua primeira compra na GR Design.' || E'\n\n' ||
   'Aproveite esse benefício e escolha seus personalizados favoritos!')
on conflict (message_type) do nothing;

-- -----------------------------------------------------------------------------
-- 6. whatsapp_message_logs — registro manual (preparada → enviada
--    manualmente/cancelada). Nunca marcado como enviado automaticamente.
-- -----------------------------------------------------------------------------
create table if not exists public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  message_type text not null
    check (message_type in ('boas_vindas', 'aniversario', 'primeira_compra', 'personalizada')),
  message_content text not null,
  status text not null default 'preparada'
    check (status in ('preparada', 'enviada_manualmente', 'cancelada')),
  prepared_at timestamptz not null default now(),
  manually_confirmed_at timestamptz,
  administrator_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_message_logs_customer_id_idx
  on public.whatsapp_message_logs (customer_id);
create index if not exists whatsapp_message_logs_type_created_idx
  on public.whatsapp_message_logs (message_type, created_at desc);

-- -----------------------------------------------------------------------------
-- 7. orders.customer_id — liga pedidos já registrados a um cadastro de
--    cliente, quando o comprador estava reconhecido no momento da compra.
--    Nasce nula; pedidos de clientes não reconhecidos continuam
--    funcionando exatamente como hoje.
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists orders_customer_id_idx on public.orders (customer_id);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.customers enable row level security;
alter table public.customer_sessions enable row level security;
alter table public.customer_recovery_codes enable row level security;
alter table public.customer_benefits enable row level security;
alter table public.whatsapp_message_templates enable row level security;
alter table public.whatsapp_message_logs enable row level security;

do $$
declare
  pol record;
  target_tables text[] := array[
    'customers', 'customer_sessions', 'customer_recovery_codes',
    'customer_benefits', 'whatsapp_message_templates', 'whatsapp_message_logs'
  ];
  t text;
begin
  foreach t in array target_tables loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
  end loop;
end $$;

-- customers: dado pessoal — nenhum SELECT/INSERT/UPDATE/DELETE público.
-- Cadastro, reconhecimento e recuperação acontecem só pelas funções
-- SECURITY DEFINER abaixo (nunca por acesso direto à tabela).
create policy "customers_admin_select"
  on public.customers for select
  to authenticated
  using (public.is_admin());

create policy "customers_admin_update"
  on public.customers for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "customers_admin_delete"
  on public.customers for delete
  to authenticated
  using (public.is_admin());

-- customer_sessions / customer_recovery_codes: nenhuma policy pública (nem
-- select, nem insert) — só pelas funções abaixo. Administradoras podem
-- consultar para fins de suporte/segurança.
create policy "customer_sessions_admin_select"
  on public.customer_sessions for select
  to authenticated
  using (public.is_admin());

create policy "customer_sessions_admin_update"
  on public.customer_sessions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "customer_recovery_codes_admin_select"
  on public.customer_recovery_codes for select
  to authenticated
  using (public.is_admin());

-- customer_benefits: nenhum SELECT/UPDATE público direto — a consulta do
-- próprio cliente acontece via get_customer_session(), e a reserva via
-- reserve_first_purchase_benefit() (ambas abaixo). Confirmação/cancelamento
-- de uso é sempre manual, pela administradora.
create policy "customer_benefits_admin_select"
  on public.customer_benefits for select
  to authenticated
  using (public.is_admin());

create policy "customer_benefits_admin_update"
  on public.customer_benefits for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- whatsapp_message_templates: só administradoras (textos não são públicos,
-- só usados ao montar o link de WhatsApp no painel).
create policy "whatsapp_message_templates_admin_select"
  on public.whatsapp_message_templates for select
  to authenticated
  using (public.is_admin());

create policy "whatsapp_message_templates_admin_update"
  on public.whatsapp_message_templates for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- whatsapp_message_logs: só administradoras (preparar/confirmar/cancelar).
create policy "whatsapp_message_logs_admin_all"
  on public.whatsapp_message_logs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- Funções SECURITY DEFINER — único caminho de escrita/leitura pública
-- (sem autenticação Supabase) para o fluxo de cadastro/reconhecimento.
-- Todas travam o search_path (mesmo padrão de is_admin()/
-- count_orders_by_phone()) e recebem só o que a aplicação já validou com
-- Zod no servidor — nunca confiam em dados "crus" do navegador para regras
-- de negócio (ex.: percentual de desconto é sempre o valor fixo da tabela).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- register_customer: cria o cadastro, o benefício de primeira compra, a
-- primeira sessão (token já hasheado pelo servidor) e o código de
-- recuperação (idem) — tudo em uma única transação implícita da função.
-- Rejeita telefone duplicado com uma mensagem clara (sem vazar detalhes
-- internos do banco).
-- -----------------------------------------------------------------------------
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
  p_session_expires_at timestamptz,
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

  insert into public.customer_recovery_codes (customer_id, code_hash)
  values (v_customer_id, p_recovery_code_hash);

  return query select v_customer_id, p_full_name;
end;
$$;

grant execute on function public.register_customer(
  text, text, text, date, text, text, text, text, text, text, text,
  boolean, text, text, timestamptz, text
) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- get_customer_session: reconhece o cliente a partir do hash do token do
-- cookie. Atualiza last_used_at. Devolve também a situação do benefício de
-- primeira compra, para a loja mostrar "disponível"/"já utilizado" sem uma
-- segunda consulta.
-- -----------------------------------------------------------------------------
create or replace function public.get_customer_session(p_token_hash text)
returns table (
  customer_id uuid,
  full_name text,
  phone text,
  birth_date date,
  zip_code text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  whatsapp_marketing_opt_in boolean,
  benefit_status text,
  benefit_discount_percentage numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session record;
begin
  select cs.customer_id into v_session
  from public.customer_sessions cs
  where cs.token_hash = p_token_hash
    and cs.revoked_at is null
    and cs.expires_at > now()
  limit 1;

  if v_session.customer_id is null then
    return;
  end if;

  update public.customer_sessions
  set last_used_at = now()
  where customer_sessions.token_hash = p_token_hash;

  return query
  select
    c.id, c.full_name, c.phone, c.birth_date,
    c.zip_code, c.street, c.number, c.complement, c.neighborhood, c.city, c.state,
    c.whatsapp_marketing_opt_in,
    coalesce(b.status, 'indisponivel'),
    b.discount_percentage
  from public.customers c
  left join public.customer_benefits b
    on b.customer_id = c.id and b.benefit_type = 'primeira_compra'
  where c.id = v_session.customer_id;
end;
$$;

grant execute on function public.get_customer_session(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- recover_customer_session: valida telefone + código de recuperação (por
-- hash) e, se corretos, cria uma nova sessão (novo dispositivo). Resposta
-- sempre genérica em caso de falha — nunca revela se o telefone existe.
-- Limita tentativas (5) com intervalo de 15 minutos após o limite.
-- -----------------------------------------------------------------------------
create or replace function public.recover_customer_session(
  p_phone_normalized text,
  p_code_hash text,
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
  v_code record;
begin
  select c.id into v_customer_id
  from public.customers c
  where c.phone_normalized = p_phone_normalized;

  if v_customer_id is null then
    return;
  end if;

  select rc.* into v_code
  from public.customer_recovery_codes rc
  where rc.customer_id = v_customer_id
    and rc.revoked_at is null
    and (rc.expires_at is null or rc.expires_at > now())
  order by rc.created_at desc
  limit 1;

  if v_code.id is null then
    return;
  end if;

  if v_code.attempts >= 5 and v_code.last_attempt_at > now() - interval '15 minutes' then
    raise exception 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  end if;

  if v_code.code_hash <> p_code_hash then
    update public.customer_recovery_codes
    set attempts = case
          when last_attempt_at is not null and last_attempt_at < now() - interval '15 minutes'
            then 1
          else attempts + 1
        end,
        last_attempt_at = now()
    where id = v_code.id;
    return;
  end if;

  update public.customer_recovery_codes
  set used_at = now(), attempts = 0, last_attempt_at = now()
  where id = v_code.id;

  insert into public.customer_sessions (customer_id, token_hash, expires_at)
  values (v_customer_id, p_session_token_hash, p_session_expires_at);

  return query select c.id, c.full_name from public.customers c where c.id = v_customer_id;
end;
$$;

grant execute on function public.recover_customer_session(text, text, text, timestamptz) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- rotate_recovery_code: gera um novo código a partir de uma sessão já
-- reconhecida (revoga o anterior). Usado quando o cliente perde o código.
-- -----------------------------------------------------------------------------
create or replace function public.rotate_recovery_code(
  p_session_token_hash text,
  p_new_code_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
begin
  select cs.customer_id into v_customer_id
  from public.customer_sessions cs
  where cs.token_hash = p_session_token_hash
    and cs.revoked_at is null
    and cs.expires_at > now();

  if v_customer_id is null then
    return false;
  end if;

  update public.customer_recovery_codes
  set revoked_at = now()
  where customer_id = v_customer_id and revoked_at is null;

  insert into public.customer_recovery_codes (customer_id, code_hash)
  values (v_customer_id, p_new_code_hash);

  return true;
end;
$$;

grant execute on function public.rotate_recovery_code(text, text) to authenticated, anon;

-- -----------------------------------------------------------------------------
-- revoke_customer_session: logout (apaga o reconhecimento naquele
-- dispositivo). Idempotente.
-- -----------------------------------------------------------------------------
create or replace function public.revoke_customer_session(p_token_hash text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.customer_sessions
  set revoked_at = now()
  where token_hash = p_token_hash and revoked_at is null;
$$;

grant execute on function public.revoke_customer_session(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- reserve_first_purchase_benefit: troca atômica disponivel -> reservado,
-- vinculando ao pedido. O UPDATE com WHERE status = 'disponivel' é a
-- própria garantia transacional (Postgres nunca aplica duas vezes a mesma
-- linha em concorrência) — evita que duas finalizações simultâneas usem o
-- mesmo benefício.
-- -----------------------------------------------------------------------------
create or replace function public.reserve_first_purchase_benefit(
  p_customer_id uuid,
  p_order_reference uuid
)
returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_percentage numeric;
begin
  update public.customer_benefits
  set status = 'reservado', reserved_at = now(), order_reference = p_order_reference
  where customer_id = p_customer_id
    and benefit_type = 'primeira_compra'
    and status = 'disponivel'
  returning discount_percentage into v_percentage;

  return v_percentage;
end;
$$;

grant execute on function public.reserve_first_purchase_benefit(uuid, uuid) to anon, authenticated;
