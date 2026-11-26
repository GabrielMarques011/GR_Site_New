# Arquitetura

## Visão geral

Aplicação Next.js (App Router) única, com dois grupos de rotas:

- `(store)` — loja pública, Server Components por padrão, dados buscados
  diretamente no servidor via `src/services/*`.
- `administracao` — painel administrativo, protegido em duas camadas:
  1. `middleware.ts` (via `src/lib/supabase/middleware.ts`) redireciona para
     `/administracao/login` qualquer requisição sem sessão Supabase válida.
  2. `src/app/administracao/(painel)/layout.tsx` confirma, no servidor, que
     o usuário autenticado tem um registro em `admin_profiles`
     (`getCurrentAdmin()`), e só então renderiza o painel.

  A autorização de dados em si (quem pode ler/escrever o quê) nunca depende
  só dessas duas camadas de UI — ela é reforçada pelas políticas de RLS no
  Postgres (ver SECURITY.md e DATABASE.md), que são a fonte de verdade.

## Camadas

```
app/*            → páginas e rotas (Server Components, Server Actions)
components/*     → UI "burra" (design system) e layout, sem acesso a dados
features/*       → lógica de domínio por área (cart, auth, promotions,
                    administration) — contexto de carrinho, server actions,
                    formulários
services/*       → única camada que fala com o Supabase (Postgres/Storage)
lib/supabase/*   → fábricas de cliente Supabase (browser/server/middleware)
types/*          → tipos do banco (database.ts) e tipos de domínio (domain.ts)
```

Regra seguida no código: **nenhuma página ou componente chama o Supabase
diretamente** — tudo passa por `src/services/*`, que é o único lugar que
conhece nomes de tabelas/colunas. Isso faz o Supabase poder ser auditado,
testado e (se um dia necessário) trocado em um único ponto.

## Clientes Supabase

Três fábricas, uma para cada contexto de execução (nunca uma instância
global reaproveitada entre requisições):

- `src/lib/supabase/client.ts` — Client Components (`createBrowserClient`).
- `src/lib/supabase/server.ts` — Server Components/Actions/Route Handlers
  (`createServerClient`, lê/escreve cookies da requisição atual).
- `src/lib/supabase/middleware.ts` — usado só pelo `middleware.ts` raiz, para
  renovar a sessão em cada requisição e proteger `/administracao/*`.

## Renderização e dados

Todas as páginas da loja e do painel usam `createClient()` do lado do
servidor, que depende de `cookies()` (`next/headers`) — isso já marca as
rotas como dinâmicas automaticamente (nenhuma página tenta ser estática
"por acidente" com dados desatualizados). Confirmado no build: todas as
rotas de dados aparecem como `ƒ (Dynamic)`, exceto `/administracao/login`
e a página 404, que não dependem de dados.

## Preço e promoção — fonte única de verdade

`src/features/promotions/pricing.ts` (`computeProductPricing`) é a única
função que decide se uma promoção está ativa e qual o preço final. Ela é
usada tanto para exibir o preço na loja quanto para recalcular o carrinho
no servidor antes de montar a mensagem do WhatsApp — o navegador nunca é a
fonte de verdade do preço.

## Carrinho

Client-side (`src/features/cart/cart-context.tsx`), persistido em
`localStorage`. Antes de finalizar o pedido, `revalidateCart` (Server
Action) busca os produtos atuais no banco, recalcula preços/promoções,
remove itens excluídos/desativados e avisa o usuário sobre qualquer
mudança — só então a mensagem do WhatsApp é montada.

## Imagens

Upload de imagens (produtos e categorias) acontece via Server Action, que:

1. Valida tipo MIME e tamanho do arquivo.
2. Usa `sharp` para decodificar, redimensionar (máx. 1800px) e converter
   para WebP (qualidade 82) — isso também funciona como validação real do
   conteúdo do arquivo (um executável renomeado para `.jpg` falha aqui).
3. Envia o resultado para o bucket `products-images` do Supabase Storage.
4. Grava a linha em `product_images` (ou atualiza `categories.image_url`).

Exclusão de produto/imagem remove o arquivo do Storage antes de apagar a
linha do banco, para não deixar arquivos órfãos.

## Cadastro e reconhecimento de clientes

Sistema próprio, independente do Supabase Auth usado pelas administradoras
— o cliente nunca cria usuário/senha. `src/lib/customer-session.ts` gera o
token de sessão (256 bits) e o código de recuperação, e lê/grava o cookie
`HttpOnly` (`gr_customer_session`); `src/features/customers/recognize.ts`
(`getRecognizedCustomer()`) é chamado a partir de Server Components (layout
da loja, carrinho) para resolver o cookie em um cliente reconhecido, sempre
devolvendo `null` em vez de lançar quando não há sessão válida. Toda a
escrita/leitura pública real acontece em `src/services/customers.ts`, via
funções Postgres `SECURITY DEFINER` (nunca acesso direto às tabelas
`customers`/`customer_sessions`/`customer_recovery_codes` — ver
SECURITY.md). O benefício de primeira compra (`customer_benefits`) é
reservado atomicamente no checkout (`features/cart/checkout-actions.ts`) e
só confirmado manualmente pela administradora no painel
(`administracao/clientes/[id]`). As mensagens pelo WhatsApp (boas-vindas,
aniversário, primeira compra, personalizada) usam o link oficial
`api.whatsapp.com/send/` (`src/lib/utils/whatsapp-admin-link.ts`) — um
padrão deliberadamente diferente do `wa.me` usado no checkout
(`lib/utils/whatsapp.ts`), já que são fluxos distintos (administradora →
cliente vs. cliente → loja); o envio é sempre manual, e
`whatsapp_message_logs` só registra "preparada"/"enviada manualmente" (a
confirmação de envio é sempre uma ação explícita da administradora, nunca
automática).

## Decisões técnicas relevantes

- **Next.js 16 / React 19**: versões estáveis mais recentes no momento do
  desenvolvimento (ver DEPLOYMENT.md para compatibilidade com a Vercel).
- **`cacheComponents`/`partialPrefetching` desligados**: o template padrão
  do `create-next-app` vem com essas flags experimentais ligadas, mas elas
  exigem Suspense boundaries explícitos em toda leitura dinâmica. Para uma
  loja cujo catálogo, preços e carrinho precisam estar sempre atualizados,
  o custo de complexidade não compensava o ganho — foram desligadas.
- **Paginação/ordenação do catálogo em memória**: o preço final de um
  produto depende de uma janela de datas de promoção, então ordenar "por
  menor preço" exige calcular o preço efetivo de cada produto. Para o
  volume de catálogo esperado (produtos personalizados, não milhares de
  SKUs), buscar os produtos ativos filtrados e ordenar/paginar em
  JavaScript é mais simples e correto do que replicar essa lógica em SQL.
  Se o catálogo crescer muito, isso pode futuramente virar uma função ou
  view no Postgres (ver ROADMAP.md).
