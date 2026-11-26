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

## `orders` — histórico de pedidos (migration `0002_orders.sql`)

Essa tabela guarda nome e telefone de clientes — dado pessoal — então o
desenho de RLS é mais cuidadoso que o das outras tabelas:

- **Nenhum SELECT público.** Diferente de `products`/`categories`, aqui
  não existe "leitura pública dos ativos" — um visitante não pode listar
  pedidos (nem os próprios, nem de ninguém).
- **INSERT público, mas restrito por `WITH CHECK`**: qualquer visitante
  pode criar um pedido (é o próprio ato de finalizar pelo WhatsApp), mas a
  policy valida formato básico (nome não vazio, telefone com 10-15
  dígitos, itens não vazios, `status` tem que nascer como
  `em_andamento` — ninguém de fora consegue inserir um pedido já
  "concluído").
- **"Já comprei antes?" sem expor dados de ninguém**: em vez de dar
  SELECT público (que vazaria nome/telefone de todo mundo), a pergunta
  "esse telefone já tem pedido?" passa pela função
  `count_orders_by_phone()` — `SECURITY DEFINER`, com `search_path`
  travado (mesmo padrão do `is_admin()`), que devolve só um número.
  Usada tanto no formulário de checkout (`features/cart/checkout-actions.ts`)
  quanto, no servidor, para decidir o desconto de 5%.
- **UPDATE/DELETE só para administradoras** (mudar o status do pedido,
  ou remover um pedido de teste/spam).

## `seasonal_campaigns` — temas sazonais (migration `0003_seasonal_campaigns.sql`)

Mesmo desenho de RLS de `categories`/`products` (dado não sensível,
institucional):

- **SELECT público só dos temas em vigor agora**: `active = true` **e**
  dentro do prazo (`active_until` nulo ou ainda não vencido) — é o que a
  home usa para montar a seção em destaque. Um tema desligado ou vencido
  simplesmente não aparece para visitantes.
- **Administradoras leem todos os temas** (ativos, inativos e vencidos),
  para poder gerenciar tudo no painel.
- **INSERT/UPDATE/DELETE só para administradoras.**
- A coluna nova `products.campaign_id` usa `on delete set null`: excluir um
  tema nunca apaga produtos, só desvincula (mesmo comportamento já usado em
  `category_id`).

## Cadastro e reconhecimento de clientes (migration `0004_customers.sql`)

Dado pessoal (nome, telefone, data de nascimento, endereço completo), e sem
Supabase Auth (o cliente nunca cria usuário/senha) — então o desenho de
segurança é o mais cuidadoso do projeto:

- **Nenhum SELECT/INSERT/UPDATE/DELETE público em `customers`,
  `customer_sessions` ou `customer_recovery_codes`.** Toda a interação
  pública (cadastrar, reconhecer, entrar em outro aparelho) passa por
  funções `SECURITY DEFINER` com `search_path` travado (mesmo padrão de
  `is_admin()`/`count_orders_by_phone()`): `register_customer`,
  `get_customer_session`, `login_customer_by_phone`,
  `revoke_customer_session`.
- **Sessão**: token aleatório de 256 bits gerado no servidor
  (`src/lib/customer-session.ts`), guardado em cookie `HttpOnly`,
  `Secure` em produção, `SameSite=Lax`, validade de 30 dias. Só o **hash**
  (SHA-256) do token fica em `customer_sessions.token_hash` — o valor em si
  nunca é persistido, só existe no cookie do navegador do cliente.
- **Login em outro aparelho — só pelo WhatsApp (migration
  `0007_phone_login.sql`), troca deliberada de segurança por
  simplicidade, pedida explicitamente pelo dono do negócio**: o modelo
  original (código de recuperação de uso único, mostrado uma vez após o
  cadastro, exigido **junto com** o telefone para reconhecer o cadastro em
  outro aparelho) foi avaliado como impraticável — clientes esqueceriam o
  código, por mais curto que fosse. `login_customer_by_phone()` substitui
  isso por uma busca direta: existe cadastro com aquele telefone? Se sim,
  reconhece na hora; se não, avisa que não há cadastro. **Isso significa
  que não há mais nenhuma verificação de posse do número** — qualquer
  pessoa que souber o WhatsApp de alguém consegue "entrar" como essa pessoa
  em qualquer aparelho (ver endereço, data de nascimento, usar o desconto
  de primeira compra dela). É exatamente o oposto do requisito original
  ("não permitir acesso aos dados de clientes apenas digitando um número de
  WhatsApp"), mas foi um pedido explícito e repetido do dono do negócio,
  que julgou a praticidade mais importante que esse risco para um negócio
  pequeno. `customer_recovery_codes` e as funções
  `recover_customer_session()`/`rotate_recovery_code()` continuam
  existindo no banco (nada é apagado), só deixam de ser usadas pelo
  código a partir desta migration.
- **Benefício de primeira compra**: a reserva (`reserve_first_purchase_benefit`)
  é uma troca atômica `disponivel -> reservado` feita num único `UPDATE`
  com `WHERE status = 'disponivel'` — o próprio banco garante que duas
  finalizações concorrentes nunca reservem o mesmo benefício duas vezes,
  sem precisar de lock explícito. A confirmação de uso
  (`disponivel`/`reservado` -> `utilizado`) é sempre uma ação manual da
  administradora, nunca automática.
- **Administradoras leem/gerenciam tudo** (`customers`, `customer_benefits`,
  `whatsapp_message_templates`, `whatsapp_message_logs`) via `is_admin()`,
  igual às demais tabelas administrativas.
- **`orders.customer_id`** usa `on delete set null`: excluir um cadastro de
  cliente nunca apaga o histórico de pedidos já registrado, só desvincula.
- **Mensagens pelo WhatsApp**: o projeto propositalmente não usa WhatsApp
  Cloud API nem nenhum serviço de envio automático — os links usam o
  formato oficial `https://api.whatsapp.com/send/?phone=...&text=...`
  (nunca `wa.me` nesse fluxo administrativo) e o envio é sempre manual,
  clicado pela administradora dentro do próprio WhatsApp.
  `whatsapp_message_logs` só registra que uma mensagem foi _preparada_
  (link aberto) e, depois, que a administradora _confirmou manualmente_ o
  envio — o sistema nunca marca como enviada sozinho.

## `orders` — INSERT direto bloqueado por RLS sem causa identificada (migration `0005_fix_order_insert.sql`)

Durante os testes desta sessão, todo `INSERT` direto em `public.orders` como
a role `anon` passou a falhar com `"new row violates row-level security
policy for table orders"` — mesmo com a policy `orders_public_insert`
(migration `0002_orders.sql`) confirmada correta e permissiva, os grants de
tabela certos para `anon`/`authenticated`, RLS habilitado sem `FORCE`, e
todas as condições do `WITH CHECK` testadas como verdadeiras (via uma
função SQL temporária executando como a role `anon` de verdade, com os
mesmos valores exatos que o checkout envia — `current_user` confirmado
como `anon`). Não foi possível identificar a causa raiz após uma
investigação extensa (comparação de papéis, cache de schema recarregado,
verificação de tabelas/views duplicadas, triggers customizados — todos
descartados). Não há como confirmar há quanto tempo isso estava
acontecendo, já que o checkout pelo WhatsApp nunca dependeu do sucesso
desse `INSERT` (ver próxima seção).

A correção: `create_order()` e `update_order_discount()`, funções
`SECURITY DEFINER` (mesmo padrão já usado com sucesso em
`register_customer()` e nas demais funções da migration
`0004_customers.sql`), substituem o `INSERT`/`UPDATE` direto na tabela. A
mesma validação que a policy fazia continua acontecendo — agora como
checagem explícita dentro da função, com `RAISE EXCEPTION` em vez de
depender do `WITH CHECK`. A policy `orders_public_insert` continua
existindo (não remove nada), só deixa de ser o caminho usado pela
aplicação.

## Checklist de segurança para produção (antes de divulgar o domínio)

- [ ] Revisar e aplicar `0001_security_hardening.sql` no projeto Supabase.
- [x] `0002_orders.sql` aplicada no Supabase (histórico de pedidos e
      desconto de primeira compra já funcionam de verdade).
- [x] `0003_seasonal_campaigns.sql` aplicada no Supabase (temas sazonais da
      home e do painel).
- [x] `0004_customers.sql` aplicada no Supabase (cadastro e reconhecimento
      de clientes, benefício de primeira compra, mensagens pelo WhatsApp
      preparadas no painel).
- [x] `0005_fix_order_insert.sql` aplicada no Supabase (corrige o registro
      de pedidos no histórico — ver seção acima).
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
