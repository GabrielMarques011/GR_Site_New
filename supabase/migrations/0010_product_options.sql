-- =============================================================================
-- Migration: 0010_product_options
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- "Subprodutos": opções de compra dentro de um mesmo produto (kits,
-- pacotes promocionais, combinações de quantidade), cada uma com
-- quantidade fixa e preço PRÓPRIO — nunca calculado automaticamente a
-- partir do preço unitário do produto principal.
--
-- Não cria produtos duplicados: a opção é só uma linha ligada ao produto
-- principal (`product_id`), nunca aparece na listagem geral de produtos.
--
-- Visibilidade: igual ao padrão de `seasonal_campaigns`/`categories` —
-- leitura pública só das opções `active = true` (quem decide quais
-- produtos/opções aparecem é sempre a RLS, não um filtro no código);
-- administradoras veem todas (ativas e inativas), via `is_admin()`.
--
-- Nada destrutivo: só cria a tabela nova. `on delete cascade` em
-- `product_id` é intencional — excluir um produto já apaga tudo ligado a
-- ele (mesmo padrão de `product_images`), nunca deixa opção órfã.
-- =============================================================================

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_options_product_id_idx
  on public.product_options (product_id);

alter table public.product_options enable row level security;

create policy "product_options_public_read"
  on public.product_options for select
  to anon, authenticated
  using (active = true);

create policy "product_options_admin_all"
  on public.product_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
