# Migrations

Scripts SQL incrementais para o projeto Supabase `jcloztrhwgtvxypybzav`.
**Nenhum script aqui é aplicado automaticamente** — cada um precisa ser
revisado e executado manualmente (SQL Editor do Supabase, ou
`supabase db push` com o CLI autenticado). Ver DATABASE.md e SECURITY.md
para o contexto completo.

| Arquivo                          | O que faz                                                                                                                                                                                                                                                                                              | Status                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `0001_security_hardening.sql`    | Recria as políticas de RLS das 6 tabelas e do bucket `products-images`; fixa o `search_path` de `is_admin()`                                                                                                                                                                                           | Proposto, não aplicado |
| `0002_orders.sql`                | Cria a tabela `orders` (histórico de pedidos do WhatsApp) + função `count_orders_by_phone` para o desconto de 1ª compra                                                                                                                                                                                | **Aplicado**           |
| `0003_seasonal_campaigns.sql`    | Cria a tabela `seasonal_campaigns` (temas sazonais ligáveis/desligáveis, com data de validade) + coluna `products.campaign_id`                                                                                                                                                                         | **Aplicado**           |
| `0004_customers.sql`             | Cria o cadastro/reconhecimento de clientes (`customers`, `customer_sessions`, `customer_recovery_codes`, `customer_benefits`, `whatsapp_message_templates`, `whatsapp_message_logs`) + coluna `orders.customer_id`. `customer_recovery_codes` segue existindo mas sem uso desde `0007_phone_login.sql` | **Aplicado**           |
| `0005_fix_order_insert.sql`      | Corrige o registro de pedidos (RLS bloqueava o INSERT direto sem causa identificada) trocando por funções `create_order()`/`update_order_discount()`                                                                                                                                                   | **Aplicado**           |
| `0006_admin_create_customer.sql` | Permite admins cadastrarem clientes direto pelo painel (`admin_create_customer()`)                                                                                                                                                                                                                     | **Aplicado**           |
| `0007_phone_login.sql`           | Simplifica o login em outro aparelho para apenas o WhatsApp cadastrado (`login_customer_by_phone()`), substituindo o código de recuperação — troca deliberada de segurança por simplicidade, pedida explicitamente (ver SECURITY.md)                                                                   | Proposto, não aplicado |

Regras para novos arquivos: nunca destrutivo (sem `DROP TABLE`/`TRUNCATE`/
exclusão de usuários), nomeação sequencial, comentário explicando o
"porquê" no topo, aprovação antes de rodar em produção.
