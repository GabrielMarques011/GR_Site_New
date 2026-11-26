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
| Checkout pede nome + WhatsApp e registra o pedido no histórico                                                          | `src/features/cart/checkout-form.tsx`, `src/features/cart/checkout-actions.ts`   |
| Desconto de 5% automático na primeira compra (por telefone)                                                             | `checkout-actions.ts` (`countOrdersByPhone` + `count_orders_by_phone` no banco)  |
| Sem pagamento online / sem afirmar pedido confirmado                                                                    | Não implementado de propósito; texto deixa claro que é "combinado pelo WhatsApp" |
| Cadastro simples de clientes (sem login/senha/e-mail/CPF), `/cadastro`                                                  | `src/features/customers/register-form.tsx`, `src/app/(store)/cadastro/`         |
| Reconhecimento automático no mesmo dispositivo (cookie de sessão)                                                       | `src/lib/customer-session.ts`, `src/features/customers/recognize.ts`            |
| Recuperação do cadastro em outro dispositivo por telefone + código                                                     | `src/features/customers/recover-form.tsx`, função `recover_customer_session()`  |
| Mensagem de boas-vindas para cliente reconhecido                                                                       | `src/features/customers/welcome-banner.tsx`                                      |
| Desconto de 5% na primeira compra ligado ao cadastro (reserva transacional)                                             | `src/services/customer-benefits.ts`, função `reserve_first_purchase_benefit()`  |
| Preenchimento automático de nome/WhatsApp no checkout para cliente reconhecido                                          | `src/features/cart/checkout-form.tsx`                                           |

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
| Histórico de pedidos com status (em andamento/concluído/recusado)                                            | `src/features/administration/orders/*`, `src/app/administracao/(painel)/historico/` |
| Gestão de clientes (listagem, busca, filtros, paginação, indicadores, detalhes, edição, exclusão)            | `src/features/administration/customers/*`, `src/app/administracao/(painel)/clientes/` |
| Controle do benefício de primeira compra (confirmar/cancelar reserva/revogar)                                | `src/features/administration/customers/benefit-panel.tsx`                           |
| Identificação de aniversariantes (hoje/mês) e envio manual de parabéns pelo WhatsApp                         | filtro "Aniversariantes do mês" em `clientes/`, `whatsapp-send-button.tsx`           |
| Links do WhatsApp no formato oficial `api.whatsapp.com/send/`, sem API paga, envio sempre manual              | `src/lib/utils/whatsapp-admin-link.ts`                                              |
| Modelos de mensagem editáveis (boas-vindas/aniversário/primeira compra)                                      | `src/app/administracao/(painel)/clientes/modelos/`                                  |
| Histórico de mensagens preparadas/confirmadas manualmente                                                    | `src/services/whatsapp-message-logs.ts`, `message-history.tsx`                      |

## Infraestrutura e segurança

| Requisito                                                                | Onde                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Reaproveitar Supabase existente (sem criar novo projeto)                 | `src/lib/supabase/*` aponta para `jcloztrhwgtvxypybzav`                                     |
| Variáveis de ambiente sem segredo no frontend                            | `.env.example`, `src/lib/supabase/env.ts`                                                   |
| `.gitignore` sem credenciais                                             | ver `.gitignore`                                                                            |
| Migrations incrementais, não destrutivas, com aprovação antes de aplicar | `supabase/migrations/0001_security_hardening.sql` (proposta) e `0002_orders.sql` (aplicada) |
| Auditoria das políticas de RLS                                           | `SECURITY.md`                                                                               |
| Preparo para Vercel + GitHub                                             | `DEPLOYMENT.md`                                                                             |

## Fora do escopo desta versão (explicitamente, por pedido do briefing)

- Pagamento online.
- Criação automática de novos administradores.
- Alterações destrutivas no banco remoto sem aprovação.
- Deploy e push para repositórios remotos sem autorização explícita.
- WhatsApp Cloud API ou qualquer serviço pago de mensageria — por pedido
  explícito, mensagens usam apenas o link oficial `api.whatsapp.com/send/`
  com envio manual pela administradora.
- Envio automático de mensagens (boas-vindas, aniversário, promocional) —
  o sistema só identifica e prepara a mensagem; confirmar o envio é sempre
  uma ação manual.
- Cron/Edge Function para aniversariantes — a identificação acontece sob
  demanda, quando o painel é acessado.
