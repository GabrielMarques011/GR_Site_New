# Migrations

Scripts SQL incrementais para o projeto Supabase `jcloztrhwgtvxypybzav`.
**Nenhum script aqui é aplicado automaticamente** — cada um precisa ser
revisado e executado manualmente (SQL Editor do Supabase, ou
`supabase db push` com o CLI autenticado). Ver DATABASE.md e SECURITY.md
para o contexto completo.

| Arquivo                       | O que faz                                                                                                               | Status                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `0001_security_hardening.sql` | Recria as políticas de RLS das 6 tabelas e do bucket `products-images`; fixa o `search_path` de `is_admin()`            | Proposto, não aplicado |
| `0002_orders.sql`             | Cria a tabela `orders` (histórico de pedidos do WhatsApp) + função `count_orders_by_phone` para o desconto de 1ª compra | **Aplicado**           |
| `0003_seasonal_campaigns.sql` | Cria a tabela `seasonal_campaigns` (temas sazonais ligáveis/desligáveis, com data de validade) + coluna `products.campaign_id` | Proposto, não aplicado |

Regras para novos arquivos: nunca destrutivo (sem `DROP TABLE`/`TRUNCATE`/
exclusão de usuários), nomeação sequencial, comentário explicando o
"porquê" no topo, aprovação antes de rodar em produção.
