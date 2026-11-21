# Requisitos

Resumo rastreável dos requisitos pedidos no briefing do projeto e onde cada
um foi atendido no código. Não repete o briefing inteiro — serve como
checklist de cobertura.

## Loja pública

| Requisito                                                                                                               | Onde                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Cabeçalho com logo, menu, carrinho com contador                                                                         | `src/components/layout/header.tsx`                                               |
| Página inicial (banner, sobre, categorias, destaques, promoções, diferenciais, contato, Instagram, localização, rodapé) | `src/app/(store)/page.tsx`, `src/components/layout/footer.tsx`                   |
| Catálogo com busca, filtro por categoria, ordenação, paginação                                                          | `src/app/(store)/produtos/page.tsx`, `src/components/store/catalog-toolbar.tsx`  |
| Produtos só ativos aparecem na loja                                                                                     | `src/services/products.ts` (`getPublicProducts`, `getProductBySlug`)             |
| Página de produto (`/produtos/[slug]`) com galeria, preço, promoção, estoque, quantidade                                | `src/app/(store)/produtos/[slug]/page.tsx`                                       |
| Categorias ilimitadas, não fixas no código                                                                              | Vêm 100% do banco (`categories`)                                                 |
| Carrinho (adicionar/remover/alterar quantidade/subtotal/total)                                                          | `src/features/cart/*`                                                            |
| Preço recalculado no servidor antes do checkout                                                                         | `src/features/cart/revalidate-cart.ts`                                           |
| Finalização via WhatsApp com itens, preços e total                                                                      | `src/lib/utils/whatsapp.ts`, `src/features/cart/cart-view.tsx`                   |
| Sem pagamento online / sem afirmar pedido confirmado                                                                    | Não implementado de propósito; texto deixa claro que é "combinado pelo WhatsApp" |

## Painel administrativo

| Requisito                                                                                                    | Onde                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Login restrito aos admins existentes, sem cadastro público                                                   | `src/features/auth/*`, `src/app/administracao/login/`                               |
| Proteção de rotas (middleware + checagem server-side)                                                        | `middleware.ts`, `src/app/administracao/(painel)/layout.tsx`                        |
| Dashboard com indicadores                                                                                    | `src/services/dashboard.ts`, `src/app/administracao/(painel)/page.tsx`              |
| CRUD de produtos (nome, descrição, preço, promoção, categoria, SKU, estoque, destaque, ordem, ativo/inativo) | `src/features/administration/products/*`                                            |
| CRUD de categorias (com tratamento de produtos ao excluir)                                                   | `src/features/administration/categories/*`, `services/categories.ts#deleteCategory` |
| Upload de imagens (múltiplas, validação, WebP, sem órfãos no Storage)                                        | `src/services/product-images.ts`, `src/services/category-images.ts`                 |
| Promoções (preço promocional, datas, selo, preço calculado)                                                  | `src/features/promotions/pricing.ts`                                                |
| Configurações da loja (`store_settings`)                                                                     | `src/features/administration/settings/*`                                            |
| Auditoria de ações administrativas                                                                           | `src/services/audit.ts`, `src/app/administracao/(painel)/auditoria/`                |

## Infraestrutura e segurança

| Requisito                                                                | Onde                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Reaproveitar Supabase existente (sem criar novo projeto)                 | `src/lib/supabase/*` aponta para `jcloztrhwgtvxypybzav`                    |
| Variáveis de ambiente sem segredo no frontend                            | `.env.example`, `src/lib/supabase/env.ts`                                  |
| `.gitignore` sem credenciais                                             | ver `.gitignore`                                                           |
| Migrations incrementais, não destrutivas, com aprovação antes de aplicar | `supabase/migrations/0001_security_hardening.sql` (proposta, não aplicada) |
| Auditoria das políticas de RLS                                           | `SECURITY.md`                                                              |
| Preparo para Vercel + GitHub                                             | `DEPLOYMENT.md`                                                            |

## Fora do escopo desta versão (explicitamente, por pedido do briefing)

- Pagamento online.
- Criação automática de novos administradores.
- Alterações destrutivas no banco remoto sem aprovação.
- Deploy e push para repositórios remotos sem autorização explícita.
