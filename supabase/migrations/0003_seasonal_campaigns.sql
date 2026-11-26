-- =============================================================================
-- Migration: 0003_seasonal_campaigns
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Cria a tabela `seasonal_campaigns` — os "temas sazonais" que a
-- administradora liga/desliga no painel (Natal, Dia das Mães, Volta às
-- aulas, etc.), cada um com uma data de validade opcional — e a coluna
-- `products.campaign_id`, que marca quais produtos pertencem a cada tema.
-- Alimenta a nova seção em destaque da home e a nova tela "Campanhas" do
-- painel.
--
-- Como rodar:
--   1. Leia o script inteiro antes de aplicar.
--   2. Rode no SQL Editor do Supabase (ou via `supabase db push`).
--   3. Não apaga nem altera nenhuma tabela existente — só cria uma tabela
--      nova e uma coluna nova em `products` (nasce sempre nula, então
--      nenhum produto existente muda de comportamento).
--
-- "Ativo de verdade" nunca é só o booleano `active`: a aplicação sempre
-- combina `active = true` com `active_until` (nulo = sem prazo, ou uma data
-- futura) para decidir o que mostrar — assim um tema vence sozinho quando a
-- data passa, sem precisar de nenhum job agendado (mesmo princípio já usado
-- para o preço promocional, calculado ao vivo em `computeProductPricing`).
--
-- O código em src/services/campaigns.ts e src/services/products.ts foi
-- escrito para nunca quebrar a listagem/criação/edição de produtos (telas
-- que já funcionavam antes) caso esta migration ainda não tenha sido
-- aplicada — mas aplicar logo após o deploy evita qualquer janela de
-- inconsistência.
-- =============================================================================

create table if not exists public.seasonal_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default false,
  active_until date,
  is_default boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seasonal_campaigns_active_idx
  on public.seasonal_campaigns (active);

drop trigger if exists seasonal_campaigns_set_updated_at on public.seasonal_campaigns;
create trigger seasonal_campaigns_set_updated_at
  before update on public.seasonal_campaigns
  for each row execute function public.set_updated_at();

alter table public.products
  add column if not exists campaign_id uuid references public.seasonal_campaigns(id) on delete set null;

create index if not exists products_campaign_id_idx
  on public.products (campaign_id);

alter table public.seasonal_campaigns enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'seasonal_campaigns'
  loop
    execute format('drop policy if exists %I on public.seasonal_campaigns', pol.policyname);
  end loop;
end $$;

-- Qualquer visitante só pode ler os temas realmente em vigor agora (ligado
-- e dentro do prazo) — é o que alimenta a seção em destaque da home.
create policy "seasonal_campaigns_public_read_active"
  on public.seasonal_campaigns for select
  to anon, authenticated
  using (active = true and (active_until is null or active_until >= current_date));

-- Administradoras leem e gerenciam todos os temas (ativos, inativos e
-- expirados) para poder ligar/desligar e editar a data de validade.
create policy "seasonal_campaigns_admin_select_all"
  on public.seasonal_campaigns for select
  to authenticated
  using (public.is_admin());

create policy "seasonal_campaigns_admin_insert"
  on public.seasonal_campaigns for insert
  to authenticated
  with check (public.is_admin());

create policy "seasonal_campaigns_admin_update"
  on public.seasonal_campaigns for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "seasonal_campaigns_admin_delete"
  on public.seasonal_campaigns for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Semente: os 11 temas fixos pedidos. Só o Natal começa ativo (até 25/12).
-- `is_default = true` impede que sejam excluídos pelo painel (só
-- desativados) — a lista fixa nunca some por engano; a administradora ainda
-- pode adicionar outros temas próprios por cima destes.
-- -----------------------------------------------------------------------------
insert into public.seasonal_campaigns (slug, name, active, active_until, is_default, display_order)
values
  ('volta-as-aulas',    'Volta às aulas',    false, null,         true, 10),
  ('dia-das-mulheres',  'Dia das Mulheres',  false, null,         true, 20),
  ('dia-das-maes',      'Dia das Mães',      false, null,         true, 30),
  ('dia-dos-namorados', 'Dia dos Namorados', false, null,         true, 40),
  ('dia-dos-pais',      'Dia dos Pais',      false, null,         true, 50),
  ('dia-dos-avos',      'Dia dos Avós',      false, null,         true, 60),
  ('outubro-rosa',      'Outubro Rosa',      false, null,         true, 70),
  ('dia-das-criancas',  'Dia das Crianças',  false, null,         true, 80),
  ('setembro-amarelo',  'Setembro Amarelo',  false, null,         true, 90),
  ('novembro-azul',     'Novembro Azul',     false, null,         true, 100),
  ('natal',             'Natal',             true,  '2026-12-25', true, 110)
on conflict (slug) do nothing;
