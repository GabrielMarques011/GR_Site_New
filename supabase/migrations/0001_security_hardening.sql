-- =============================================================================
-- Migration: 0001_security_hardening
-- Status:     PROPOSTA — NÃO APLICADA AUTOMATICAMENTE
-- =============================================================================
-- Este script NÃO foi executado no projeto Supabase remoto (jcloztrhwgtvxypybzav).
-- Ele foi escrito a partir da auditoria de segurança pedida na Seção 8 do
-- briefing do projeto, SEM acesso de leitura ao banco remoto (nenhuma
-- credencial com permissão de introspecção/Management API foi fornecida a
-- este ambiente). Antes de rodar:
--
--   1. Leia cada bloco e confira se bate com o que existe hoje no projeto
--      (Dashboard do Supabase > Authentication > Policies, e
--      Database > Functions).
--   2. Rode este script no SQL Editor do Supabase (ou via `supabase db push`)
--      em um momento de baixo tráfego — ele reescreve policies, não dados.
--   3. Nenhum DROP TABLE, TRUNCATE ou exclusão de linhas é executado aqui.
--      Apenas policies de RLS, a configuração da função is_admin() e
--      policies de Storage são recriadas.
--
-- O padrão "DROP todas as policies existentes da tabela, então recria" é
-- usado de propósito: adicionar uma policy nova SEM remover uma antiga mais
-- permissiva não restringe nada (policies permissivas do Postgres são
-- combinadas com OR). Para endurecer de verdade, as antigas precisam sair.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Função is_admin(): mantém a lógica existente, apenas fixa o search_path.
--    Uma função SECURITY DEFINER sem search_path travado pode ser enganada
--    por um schema/tabela forjado com o mesmo nome em outro schema que
--    apareça antes de `public` no search_path da sessão que a chama.
-- -----------------------------------------------------------------------------
alter function public.is_admin() set search_path = public, pg_temp;

-- -----------------------------------------------------------------------------
-- Helper: remove todas as policies existentes de uma tabela antes de recriar.
-- -----------------------------------------------------------------------------
do $$
declare
  pol record;
  target_tables text[] := array[
    'admin_profiles', 'categories', 'products', 'product_images',
    'store_settings', 'audit_logs'
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

-- -----------------------------------------------------------------------------
-- 2. admin_profiles
--    - Cada admin só enxerga o próprio perfil (evita vazar nomes/roles de
--      outros administradores para qualquer sessão autenticada).
--    - Ninguém além de is_admin() pode alterar role/inserir linhas por aqui;
--      gestão de administradores continua manual, direto no banco.
-- -----------------------------------------------------------------------------
create policy "admin_profiles_select_own"
  on public.admin_profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin_profiles_update_own_name"
  on public.admin_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = 'admin');

-- Nenhuma policy de INSERT/DELETE é criada: a criação de administradores
-- continua sendo uma operação manual (ver Seção 6 do briefing), nunca
-- exposta à aplicação.

-- -----------------------------------------------------------------------------
-- 3. categories
--    - Leitura pública apenas de categorias ativas.
--    - Administradores leem e gerenciam tudo (ativo e inativo).
-- -----------------------------------------------------------------------------
create policy "categories_public_read_active"
  on public.categories for select
  to anon, authenticated
  using (active = true);

create policy "categories_admin_select_all"
  on public.categories for select
  to authenticated
  using (public.is_admin());

create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. products
--    - Leitura pública apenas de produtos ativos.
--    - Administradores leem e gerenciam ativos e inativos.
-- -----------------------------------------------------------------------------
create policy "products_public_read_active"
  on public.products for select
  to anon, authenticated
  using (active = true);

create policy "products_admin_select_all"
  on public.products for select
  to authenticated
  using (public.is_admin());

create policy "products_admin_insert"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy "products_admin_update"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_admin_delete"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. product_images
--    - Leitura pública apenas de imagens de produtos ativos.
--    - Administradores gerenciam imagens de qualquer produto.
-- -----------------------------------------------------------------------------
create policy "product_images_public_read_active_product"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.active = true
    )
  );

create policy "product_images_admin_select_all"
  on public.product_images for select
  to authenticated
  using (public.is_admin());

create policy "product_images_admin_insert"
  on public.product_images for insert
  to authenticated
  with check (public.is_admin());

create policy "product_images_admin_update"
  on public.product_images for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_images_admin_delete"
  on public.product_images for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. store_settings
--    - A tabela hoje só guarda campos institucionais (nome, slogan, texto
--      sobre, whatsapp, instagram, endereço, mapa, logo) — nenhum deles é
--      sensível, então leitura pública permanece permitida. Mesmo assim a
--      aplicação já seleciona apenas essas colunas explicitamente (ver
--      src/services/settings.ts) como defesa em profundidade, e a escrita
--      fica restrita a administradores.
-- -----------------------------------------------------------------------------
create policy "store_settings_public_read"
  on public.store_settings for select
  to anon, authenticated
  using (true);

create policy "store_settings_admin_update"
  on public.store_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sem policy de INSERT/DELETE: a linha de configurações é única e já existe;
-- criar/excluir essa linha continua sendo uma operação manual no banco.

-- -----------------------------------------------------------------------------
-- 7. audit_logs
--    - Log é só para administradores lerem; ninguém pode alterar/apagar
--      registros (log imutável). Inserção é feita pela própria aplicação
--      (sempre em nome de um admin autenticado).
-- -----------------------------------------------------------------------------
create policy "audit_logs_admin_select"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create policy "audit_logs_admin_insert"
  on public.audit_logs for insert
  to authenticated
  with check (public.is_admin());

-- Sem policy de UPDATE/DELETE: auditoria é somente para inserção/leitura.

-- -----------------------------------------------------------------------------
-- 8. Storage: bucket products-images
--    - Leitura pública (bucket já é público para visualização).
--    - Upload/alteração/exclusão restritos a administradores.
--    - Caminho precisa começar com "products/" ou "categories/" (os únicos
--      prefixos usados pela aplicação — ver src/services/product-images.ts
--      e src/services/category-images.ts), reduzindo a superfície de uso
--      indevido do bucket para armazenar outros arquivos.
-- -----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'products_images_%'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "products_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products-images');

create policy "products_images_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'products-images'
    and (name like 'products/%' or name like 'categories/%')
    and public.is_admin()
  );

create policy "products_images_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products-images' and public.is_admin())
  with check (bucket_id = 'products-images' and public.is_admin());

create policy "products_images_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products-images' and public.is_admin());
