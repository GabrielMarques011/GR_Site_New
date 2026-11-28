# Banco de dados (Supabase)

> **Importante**: este ambiente de desenvolvimento não recebeu nenhuma
> credencial com permissão de leitura do projeto Supabase remoto (nem a
> chave anon/publicável, nem um access token de Management API). Tudo
> abaixo foi escrito a partir da descrição de schema fornecida no briefing
> do projeto — **não foi confirmado contra o banco real**. Antes de confiar
> neste documento, confira o Table Editor / SQL Editor do Supabase.

- Projeto: `jcloztrhwgtvxypybzav`
- URL: `https://jcloztrhwgtvxypybzav.supabase.co`
- Plano: Free

## Tabelas existentes (não criadas por este projeto)

| Tabela                                                                                                                                  | Observação                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin_profiles`                                                                                                                        | `user_id` (FK para `auth.users`), `name`, `role`, `created_at`                                                                                                                              |
| `categories`                                                                                                                            | `id`, `name`, `slug`, `description`, `image_url`, `display_order`, `active`, timestamps                                                                                                     |
| `products`                                                                                                                              | ver campos abaixo                                                                                                                                                                           |
| `product_images`                                                                                                                        | `id`, `product_id`, `storage_path`, `image_url`, `alt_text`, `display_order`, `created_at`                                                                                                  |
| `store_settings`                                                                                                                        | `id`, `store_name`, `slogan`, `about_text`, `whatsapp`, `instagram_url`, `address`, `maps_url`, `logo_url`, `updated_at`                                                                    |
| `audit_logs`                                                                                                                            | `id`, `user_id`, `action`, `entity`, `entity_id`, `details`, `created_at`                                                                                                                   |
| `orders`                                                                                                                                | Criada pela migration `0002_orders.sql` — **aplicada** no Supabase; ver detalhes abaixo                                                                                                     |
| `seasonal_campaigns`                                                                                                                    | Criada pela migration `0003_seasonal_campaigns.sql` — **aplicada** no Supabase; ver detalhes abaixo                                                                                         |
| `customers`, `customer_sessions`, `customer_recovery_codes`, `customer_benefits`, `whatsapp_message_templates`, `whatsapp_message_logs` | Criadas pela migration `0004_customers.sql` — **aplicada** no Supabase; ver detalhes abaixo. `customer_recovery_codes` segue existindo mas sem uso desde a migration `0007_phone_login.sql` |
| `order_charge_logs`                                                                                                                     | Criada pela migration `0008_order_payments.sql` — **aplicada** no Supabase; ver detalhes abaixo                                                                                             |
| `suppliers`, `material_purchases`, `material_purchase_items`, `stock_movements`                                                         | Criadas pela migration `0009_material_purchases.sql` — **aplicada** no Supabase; ver detalhes abaixo                                                                                        |
| `product_options`                                                                                                                       | Criada pela migration `0010_product_options.sql` — ver detalhes abaixo                                                                                                                      |
| `products.kind`, `categories.kind`                                                                                                      | Colunas adicionadas pela migration `0011_store_module.sql` — ver detalhes abaixo                                                                                                            |

Campos de `products`: `id`, `category_id`, `campaign_id` (adicionado pela
migration `0003_seasonal_campaigns.sql`), `kind` (adicionado pela migration
`0011_store_module.sql` — `'personalizado' | 'loja'`, default
`'personalizado'`), `name`, `slug`, `description`, `price`,
`promotional_price`, `promotion_start`, `promotion_end`, `sku`,
`stock_quantity`, `featured`, `active`, `display_order`, `created_at`,
`updated_at`.

Campos de `product_options`: `id`, `product_id`, `name`, `quantity`
(inteiro, fixo), `price` (próprio, nunca `quantity × products.price`),
`active`, `display_order`, timestamps. `on delete cascade` em `product_id`
— excluir o produto já apaga as opções ligadas a ele, nunca deixa opção
órfã.

Funções existentes: `public.is_admin()`, `public.set_updated_at()` (+
triggers de `updated_at`). RLS habilitado nas 6 tabelas, com políticas de
leitura pública e políticas administrativas já criadas (estado inicial —
ver auditoria em SECURITY.md).

Bucket de Storage: `products-images` (público para leitura).

## Mapeamento para o código

- `src/types/database.ts` — tipos TypeScript escritos manualmente a partir
  desta descrição (não gerados pelo `supabase gen types`, por falta de
  credencial). **Assim que houver um access token disponível**, rode:

  ```bash
  npx supabase login
  npx supabase gen types typescript --project-id jcloztrhwgtvxypybzav > src/types/database.ts
  ```

  e confira se o resultado bate com o que foi escrito manualmente (ajuste
  `src/types/domain.ts` e os serviços em `src/services/*` se houver
  divergência de nomes/tipos de coluna).

- `src/services/*` — única camada que faz queries ao Supabase. Cada arquivo
  corresponde a uma tabela/área: `products.ts`, `categories.ts`,
  `product-images.ts`, `category-images.ts`, `settings.ts`, `audit.ts`,
  `dashboard.ts`.

## Migrations incrementais

Pasta `supabase/migrations/`. Nenhuma migration deste projeto é aplicada
automaticamente no banco remoto — cada uma é revisada e executada
manualmente (SQL Editor do Supabase ou `supabase db push`); o status de
cada uma abaixo reflete o que foi confirmado até agora.

- `0001_security_hardening.sql` — endurece as políticas de RLS das 6
  tabelas e do bucket `products-images`, e fixa o `search_path` de
  `public.is_admin()`. Não altera dados, não recria tabelas. Ver SECURITY.md
  para a justificativa de cada policy. **Status: proposta, ainda não
  confirmada como aplicada.**
- `0002_orders.sql` — cria a tabela `orders` (histórico de pedidos
  enviados pelo WhatsApp: nome, telefone, itens, total, status) e a
  função `public.count_orders_by_phone()`, usada para o desconto de 5% na
  primeira compra. **Status: aplicada no Supabase.** Se alguma vez essa
  tabela sumir ou for revertida, o checkout pelo WhatsApp continua
  funcionando (o código foi escrito para degradar sem quebrar), mas sem
  gravar histórico e tratando todo cliente como "primeira compra". Ver
  SECURITY.md para o desenho de RLS.

Campos de `orders`: `id`, `customer_name`, `customer_phone`, `items`
(jsonb — lista de `{product_id, name, quantity, unit_price, subtotal, note?}`),
`subtotal`, `discount_percent`, `total`, `is_first_purchase`, `status`
(`em_andamento` | `concluido` | `recusado`), `payment_status`
(`nao_pago` | `pago`, adicionado pela migration `0008_order_payments.sql`),
`payment_confirmed_at`, `created_at`, `updated_at`.

- `0003_seasonal_campaigns.sql` — cria a tabela `seasonal_campaigns` (os
  temas sazonais ligáveis/desligáveis no painel: Natal, Dia das Mães, Volta
  às aulas etc., cada um com `active` + `active_until`) e a coluna
  `products.campaign_id`, usada para marcar quais produtos pertencem a cada
  tema. Alimenta a seção em destaque da home e a tela "Campanhas" do
  painel. **Status: proposta, ainda não confirmada como aplicada.** Se essa
  migration ainda não tiver sido aplicada, o cadastro/edição de produtos e
  toda a listagem de produtos continuam funcionando normalmente — só a
  seção em destaque da home e o seletor de tema no formulário ficam vazios
  (código escrito para degradar sem quebrar, ver `src/services/campaigns.ts`
  e `src/services/products.ts`).

Campos de `seasonal_campaigns`: `id`, `slug`, `name`, `active`,
`active_until` (data; nulo = sem prazo), `is_default` (true para os 11
temas fixos, que só podem ser desativados, nunca excluídos), `display_order`,
`created_at`, `updated_at`.

- `0004_customers.sql` — cria o sistema de cadastro/reconhecimento de
  clientes: `customers` (dados pessoais e endereço, sem login/senha/e-mail),
  `customer_sessions` (sessão persistente por dispositivo, só o hash do
  token é gravado), `customer_recovery_codes` (código mostrado uma vez após
  o cadastro, pensado originalmente para recuperar o cadastro em outro
  aparelho — **substituído pela migration `0007_phone_login.sql`, ver
  abaixo**; a tabela e as funções que a usavam continuam existindo, só
  ficaram sem uso), `customer_benefits` (desconto de 5% na primeira compra, com reserva
  transacional ligada a um pedido), `whatsapp_message_templates` (boas-
  vindas/aniversário/primeira compra, editáveis no painel) e
  `whatsapp_message_logs` (registro manual de mensagem preparada →
  enviada/cancelada — o sistema nunca sabe sozinho se uma mensagem foi
  enviada de verdade, só o que a administradora confirma). Também adiciona
  `orders.customer_id`, ligando pedidos ao cadastro quando o comprador
  estava reconhecido. **Status: aplicada no Supabase.** Todo o código novo
  (`src/services/customers.ts`, `customer-benefits.ts`,
  `whatsapp-templates.ts`, `whatsapp-message-logs.ts`, e o `customer_id`
  em `src/services/orders.ts`) foi escrito para degradar sem quebrar o
  cadastro/edição/listagem de produtos, o checkout pelo WhatsApp e a home —
  se essa migration algum dia sumir/for revertida, a loja volta a
  funcionar exatamente como antes, só sem reconhecimento de clientes.
- `0005_fix_order_insert.sql` — corrige o registro de pedidos no
  histórico: durante os testes desta sessão, o `INSERT` direto em
  `orders` como a role `anon` passou a falhar por RLS sem causa
  identificada (policy, grants e condições todas confirmadas corretas —
  ver SECURITY.md para o detalhe da investigação). A correção troca o
  `INSERT`/`UPDATE` direto por duas funções `SECURITY DEFINER`
  (`create_order()`, `update_order_discount()`), mesmo padrão já usado com
  sucesso na migration `0004_customers.sql`. **Status: aplicada no
  Supabase** — confirmado com um pedido real salvo com o desconto de
  primeira compra corretamente aplicado.
- `0006_admin_create_customer.sql` — permite que administradoras cadastrem
  clientes direto pelo painel (`/administracao/clientes/novo`), para
  clientes que não têm ou não querem fazer o próprio cadastro. Função
  `admin_create_customer()`, `SECURITY DEFINER`, mesmo padrão das demais —
  só executa se `is_admin()` for verdadeiro. **Status: aplicada no
  Supabase.**
- `0007_phone_login.sql` — simplifica o reconhecimento em outro aparelho:
  em vez do código de recuperação (`customer_recovery_codes`), o cliente
  "entra" só informando o WhatsApp já cadastrado (`login_customer_by_phone`).
  Pedido explícito do dono do negócio, trocando segurança por simplicidade
  — ver SECURITY.md para o detalhe do risco aceito. Também remove o
  parâmetro de código de recuperação de `register_customer` e
  `admin_create_customer` (assinaturas antigas removidas com `drop function`
  e recriadas sem esse parâmetro). **Status: aplicada no Supabase.**
  `customer_recovery_codes` e as funções
  `recover_customer_session()`/`rotate_recovery_code()` continuam existindo
  no banco (nada destrutivo), só deixam de ser usadas pelo código.
- `0008_order_payments.sql` — controle de pagamento por pedido, para a
  tela `/administracao/pagamentos`: coluna `orders.payment_status`
  (`nao_pago` | `pago`, todo pedido nasce não pago) e `payment_confirmed_at`,
  mais a tabela `order_charge_logs` (preparada → enviada manualmente →
  cancelada, mesmo padrão de `whatsapp_message_logs`, mas ligada ao pedido,
  não ao cliente, para funcionar mesmo em pedidos sem cadastro vinculado).
  Status de pagamento é alterado por `UPDATE` direto (como `status` do
  pedido), não por função — sempre feito por uma admin autenticada,
  já coberto pela policy `orders_admin_update` existente.
  **Status: aplicada no Supabase.**
- `0009_material_purchases.sql` — módulo "Compra de Materiais"
  (`/administracao/compras`): `suppliers` (fornecedores, cadastro mínimo:
  nome), `material_purchases` (compra principal: categoria livre,
  fornecedor, comprovante, total, status `ativa`/`cancelada`),
  `material_purchase_items` (itens da compra: produto, quantidade, valor
  unitário, subtotal) e `stock_movements` (ledger de entradas/estornos,
  para auditoria). Três funções fazem tudo atômico (criar/editar/cancelar
  uma compra + atualizar o estoque do produto na mesma transação —
  supabase-js não tem transação multi-tabela pelo REST, então isso só é
  seguro dentro de uma única função Postgres): `create_material_purchase()`,
  `update_material_purchase()` (recalcula o estoque pela diferença entre
  itens antigos e novos) e `cancel_material_purchase()` (reverte o estoque
  de cada item; bloqueia com erro se o produto já tiver estoque insuficiente
  para o estorno). Também cria o bucket de Storage **privado**
  `purchase-receipts` (diferente do `products-images`, que é público) —
  comprovante de compra é documento sensível, leitura só por URL assinada.
  **Status: aplicada no Supabase.**
- `0010_product_options.sql` — "Subprodutos": opções de compra (kits,
  pacotes) dentro de um mesmo produto, cada uma com quantidade fixa e
  preço PRÓPRIO (nunca calculado a partir do preço unitário do produto).
  Tabela `product_options` (`product_id`, `name`, `quantity`, `price`,
  `active`, `display_order`). Leitura pública só das opções `active = true`
  (mesmo padrão de `seasonal_campaigns`); administradoras veem todas. O
  pedido grava `product_option_id` no item (campo novo e opcional em
  `orders.items`, que é `jsonb` — não precisa de migration própria), só
  para rastreio futuro; nome e preço já ficam congelados no próprio nome e
  valor do item, então mudar/excluir uma opção depois nunca altera pedidos
  já feitos. **Status: aplicada no Supabase.**
- `0011_store_module.sql` — módulo "Loja" (segunda modalidade comercial,
  produtos de pronta entrega vendidos ao lado dos personalizados). Em vez
  de duplicar tabelas, `products` e `categories` ganham a coluna `kind`
  (`'personalizado' | 'loja'`, default `'personalizado'` — nenhuma linha
  existente muda) e reaproveitam 100% do CRUD, imagens, opções/kits,
  promoções, carrinho e checkout já existentes. `stock_movements` ganha o
  tipo `'saida'` (venda confirmada), ao lado de `'entrada'`/`'estorno'`, e
  a coluna `order_id` (para rastrear qual pedido gerou a movimentação).
  Nova função `set_order_status()` substitui o `UPDATE` direto do status do
  pedido: ao entrar em `'concluido'`, debita o estoque de cada item com
  `product_kind = 'loja'` (campo novo e opcional em `orders.items`, jsonb —
  não precisa de migration própria, gravado pela aplicação a partir desta
  migration) na quantidade `quantity * units_per_package` (outro campo novo
  do item, cópia do tamanho do pacote no momento da compra — nunca depende
  de uma opção que pode ter sido editada/excluída depois); bloqueia com
  erro se o estoque for insuficiente (verifica todos os itens antes de
  debitar qualquer um). Ao sair de `'concluido'`, estorna o mesmo valor.
  Pedidos sem nenhum item `'loja'` passam pela função sem nenhuma validação
  nova — comportamento idêntico ao `UPDATE` direto de antes. Kits/opções da
  Loja continuam usando um único estoque físico por produto: o campo já
  existente `product_options.quantity` passa a também significar "quantas
  unidades-base esse pacote consome" (ex: pacote de 10 folhas consome 10 do
  estoque de folhas do produto principal) — estoque independente por opção
  fica fora de escopo. **Status: proposta, ainda não confirmada como
  aplicada.**

Campos de `customers`: `id`, `full_name`, `phone`, `phone_normalized`
(E.164, único), `birth_date`, `zip_code`, `street`, `number`, `complement`,
`neighborhood`, `city`, `state`, `whatsapp_marketing_opt_in`,
`consent_date`, `consent_version`, `first_purchase_discount_used`,
`first_purchase_discount_used_at`, timestamps. Nenhuma linha de
`customers`/`customer_sessions`/`customer_recovery_codes` é lida ou escrita
diretamente pelo cliente — todo o fluxo público passa pelas funções
`register_customer`, `get_customer_session`, `login_customer_by_phone`,
`revoke_customer_session` e `reserve_first_purchase_benefit` (todas
`SECURITY DEFINER`, mesmo padrão de `is_admin()`/`count_orders_by_phone()`).
`recover_customer_session`/`rotate_recovery_code` seguem existindo mas sem
uso desde a migration `0007_phone_login.sql`.

### Regra para novas migrations

1. Nunca usar `DROP TABLE`, `TRUNCATE`, exclusão de usuários ou qualquer
   comando destrutivo de dados.
2. Preferir scripts idempotentes (`IF EXISTS` / `IF NOT EXISTS`, ou um
   bloco `DO $$ ... $$` que remove e recria apenas o necessário).
3. Nomear sequencialmente (`0002_...`, `0003_...`).
4. Documentar o "porquê" no topo do arquivo.
5. Pedir aprovação explícita antes de rodar no projeto remoto.
