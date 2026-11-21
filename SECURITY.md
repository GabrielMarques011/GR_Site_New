# Segurança

## Escopo e limitação desta auditoria

A Seção 8 do briefing pediu uma auditoria técnica das políticas de RLS do
Supabase. **Este ambiente não teve acesso de leitura ao projeto remoto**
(nenhuma chave/anon key ou access token foi fornecido), então não foi
possível listar as políticas reais hoje existentes via `pg_policies` ou o
Dashboard. A auditoria abaixo foi feita de duas formas:

1. **Estática**, sobre o código deste repositório (como a aplicação lê e
   escreve dados — isso foi verificado de fato).
2. **Proposta de banco**, descrevendo o conjunto de políticas que o
   schema documentado deveria ter, materializada em
   `supabase/migrations/0001_security_hardening.sql`. Essa migration
   **não foi aplicada** — precisa ser revisada e rodada manualmente depois
   de comparar com o que já existe no projeto.

## Defesa em profundidade adotada no código

Mesmo com RLS no banco, a aplicação não depende só dela:

- **Nenhuma rota de admin confia apenas no middleware.** `middleware.ts`
  garante só que existe uma sessão; `administracao/(painel)/layout.tsx`
  confirma no servidor que o usuário tem linha em `admin_profiles`
  (`getCurrentAdmin()`) antes de renderizar qualquer página do painel.
- **Seleção explícita de colunas** em `services/settings.ts`
  (`getPublicStoreSettings`) — mesmo que a política pública de
  `store_settings` libere a linha inteira, a aplicação só lê os campos
  institucionais, nunca `*`.
- **Validação de entrada em duas camadas**: Zod no formulário (cliente, via
  React Hook Form) e o mesmo schema Zod de novo no Server Action
  (`features/administration/*/actions.ts`) antes de qualquer escrita —
  o cliente nunca é confiável.
- **Upload de imagem** (`services/product-images.ts`,
  `services/category-images.ts`): tipo MIME e tamanho são validados, e o
  arquivo é decodificado de verdade pelo `sharp` antes de subir — um
  arquivo que não é uma imagem válida (por exemplo um executável
  renomeado) falha na conversão para WebP e nunca chega ao Storage.
- **Preço nunca confia no navegador**: `revalidateCart` (Server Action)
  busca os produtos no banco e recalcula preço/promoção antes de montar a
  mensagem do WhatsApp — um preço alterado no DevTools do navegador não
  tem efeito.
- **`.env.example` sem segredos**; `.gitignore` cobre `.env*`, chaves
  (`*.pem`, `*.key`) e artefatos de build.

## Pontos revisados (Seção 8 do briefing) e o que a migration proposta faz

| Item pedido na auditoria                                       | Proposta em `0001_security_hardening.sql`                                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin só vê o próprio perfil                                   | `admin_profiles_select_own`: `USING (user_id = auth.uid())`                                                                                                   |
| Visitante não pode virar admin alterando requisição            | Nenhuma policy de INSERT em `admin_profiles`; `UPDATE` restrito ao próprio usuário e exige `role = 'admin'` no `WITH CHECK` (não dá pra setar outro role)     |
| Visitante só vê produtos/categorias ativos                     | Policies `*_public_read_active` com `USING (active = true)`, só para `anon`/`authenticated` sem `is_admin()`                                                  |
| Admin vê e gerencia ativos e inativos                          | Policies `*_admin_select_all` / `_insert` / `_update` / `_delete` com `USING/WITH CHECK (public.is_admin())`                                                  |
| Imagens de produto seguem a visibilidade do produto            | `product_images_public_read_active_product`: `EXISTS` checando `products.active = true`                                                                       |
| Uploads validados, sem executáveis                             | Validação de MIME/tamanho + reprocessamento via `sharp` na aplicação (RLS de Storage restringe quem e onde, não o conteúdo do arquivo)                        |
| `store_settings` não deveria vazar dado sensível               | Tabela só tem campos institucionais — nenhum é sensível; leitura pública mantida, mas aplicação já seleciona só esses campos, e escrita fica restrita a admin |
| Auditoria só para admin, imutável                              | `audit_logs_admin_select` + `audit_logs_admin_insert`; sem policy de UPDATE/DELETE para ninguém                                                               |
| `is_admin()` com `SECURITY DEFINER` e `search_path` controlado | `alter function public.is_admin() set search_path = public, pg_temp;` — a lógica da função **não é redefinida** (ver nota abaixo)                             |
| Autorização não depende só da interface                        | Reforçado nas policies acima + checagem server-side em `getCurrentAdmin()`                                                                                    |

### Por que a migration não redefine o corpo de `is_admin()`

Sem acesso de leitura ao banco, não há como saber a implementação atual da
função. Substituí-la "no escuro" poderia mudar seu comportamento e quebrar
produção. A migration só ajusta o atributo de configuração (`search_path`),
que é seguro de aplicar independente da lógica interna. **Antes de aplicar,
abra a função no SQL Editor e confirme que ela já é `SECURITY DEFINER` e
que a lógica é, de fato, "existe uma linha em `admin_profiles` com
`user_id = auth.uid()`"** — se for diferente, ajuste a migration.

### Por que a migration dropa e recria policies em vez de só adicionar

Policies permissivas do Postgres são combinadas com `OR`. Adicionar uma
policy mais restritiva ao lado de uma mais permissiva (ex.: uma policy
antiga de leitura pública sem filtro de `active`) não revoga a antiga — o
acesso mais aberto continua valendo. Por isso o script remove todas as
policies existentes de cada tabela (via `pg_policies`) antes de recriar o
conjunto pretendido. Isso **não afeta dados**, só as regras de acesso.

## Storage (`products-images`)

Proposta: leitura pública mantida (o bucket já é público); upload/alteração
exigem `public.is_admin()`; e o caminho do arquivo precisa começar com
`products/` ou `categories/` (os únicos prefixos usados pela aplicação),
para reduzir o bucket virar um "HD na nuvem" para qualquer outro arquivo.

## Checklist de segurança para produção (antes de divulgar o domínio)

- [ ] Revisar e aplicar `0001_security_hardening.sql` no projeto Supabase.
- [ ] Confirmar que `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na Vercel é a
      chave anon/publicável (nunca `service_role`/`sb_secret_`).
- [ ] Rodar `npm run build` e inspecionar o bundle client-side em busca de
      qualquer string de chave secreta (não deveria haver nenhuma — o
      projeto não usa `service_role` em lugar nenhum).
- [ ] Testar login dos dois administradores reais em produção.
- [ ] Testar, com uma sessão anônima, que `/administracao` redireciona
      para o login e que chamadas diretas à API do Supabase para
      tabelas administrativas são bloqueadas pela RLS.
- [ ] Revisar os dois usuários administradores existentes (e-mails,
      senhas) — nenhum foi criado ou alterado por este projeto.
