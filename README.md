# GR Design — Loja virtual + painel administrativo

Loja virtual e painel administrativo da **GR Design** (personalizados, papelaria,
impressão e sublimação — Cotia/SP), construídos com Next.js (App Router),
TypeScript, Tailwind CSS e Supabase (Postgres + Auth + Storage).

> Documentação relacionada: [ARCHITECTURE.md](./ARCHITECTURE.md) ·
> [DATABASE.md](./DATABASE.md) · [SECURITY.md](./SECURITY.md) ·
> [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [TESTING.md](./TESTING.md) ·
> [DEPLOYMENT.md](./DEPLOYMENT.md) · [ROADMAP.md](./ROADMAP.md) ·
> [PROJECT_PLAN.md](./PROJECT_PLAN.md) · [REQUIREMENTS.md](./REQUIREMENTS.md)

## Stack

- Next.js 16 (App Router, Server Components/Actions) + React 19 + TypeScript
- Tailwind CSS v4 (identidade visual lilás própria — ver DESIGN_SYSTEM.md)
- Supabase: Postgres + Row Level Security, Auth, Storage (`products-images`)
- Zod + React Hook Form para formulários e validação
- Vitest (testes unitários) + Playwright (testes end-to-end)

## Pré-requisitos

- Node.js 20+ e npm
- Acesso ao projeto Supabase existente (`jcloztrhwgtvxypybzav`) — a URL já
  está documentada no código; a **chave publicável (anon)** precisa ser
  obtida no painel do Supabase (Project Settings → API) e configurada
  localmente (ver abaixo). Nenhuma chave secreta/`service_role` é necessária.

## Instalação

```bash
npm install
cp .env.example .env.local
# edite .env.local e preencha NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

A aplicação sobe em `http://localhost:3000`. A loja pública fica em `/` e o
painel administrativo em `/administracao` (login em `/administracao/login`,
restrito aos dois usuários administradores já cadastrados no Supabase Auth).

## Scripts disponíveis

| Script              | O que faz                                                                     |
| ------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`       | Ambiente de desenvolvimento (Turbopack)                                       |
| `npm run build`     | Build de produção                                                             |
| `npm run start`     | Sobe o build de produção                                                      |
| `npm run lint`      | ESLint                                                                        |
| `npm run typecheck` | `tsc --noEmit`                                                                |
| `npm run format`    | Formata o projeto com Prettier                                                |
| `npm run test`      | Testes unitários (Vitest)                                                     |
| `npm run test:e2e`  | Testes end-to-end (Playwright, precisa do app rodando e de credenciais reais) |

## Estrutura do projeto

```text
src/
  app/
    (store)/            loja pública: início, produtos, categorias, carrinho, sobre, contato
    administracao/       painel administrativo (login + área protegida)
  components/           componentes de UI e layout reutilizáveis
  features/             lógica de domínio por área (cart, auth, promotions, administration)
  lib/                  clientes Supabase, validações (zod), utilitários
  services/             camada de acesso a dados (Supabase) usada pelas páginas
  types/                tipos do banco (database.ts) e tipos de domínio (domain.ts)
supabase/migrations/     scripts SQL incrementais (não aplicados automaticamente)
tests/
  unit/                 testes Vitest
  e2e/                  testes Playwright
```

## Estado atual (o que já funciona vs. o que depende de configuração manual)

**Pronto e testável localmente (com a chave do Supabase configurada):**

- Loja pública conectada ao Supabase: catálogo com busca/filtro/ordenação,
  página de produto, categorias, promoções calculadas no servidor.
- Carrinho com persistência em `localStorage`, recálculo de preços no
  servidor antes de fechar pedido, finalização via WhatsApp (`wa.me`).
- Painel administrativo: login restrito, dashboard, CRUD de produtos e
  categorias, upload de imagens (convertidas para WebP), configurações da
  loja, log de auditoria.
- Testes unitários (`npm run test`) cobrindo cálculo de preço/promoção,
  geração da mensagem de WhatsApp, slugify e validação de formulários.

**Depende de configuração/ação manual (não foi feito por este ambiente):**

- **Chave do Supabase**: este ambiente não recebeu a chave publicável/anon
  real do projeto, então a conexão com o banco nunca foi testada de fato.
  Configure `.env.local` e rode `npm run dev` para validar.
- **Migration de segurança** (`supabase/migrations/0001_security_hardening.sql`):
  foi escrita a partir da auditoria pedida, mas **não foi aplicada** — exige
  revisão e execução manual no projeto Supabase (ver SECURITY.md).
- **Git/GitHub**: o repositório git local foi inicializado (pelo
  `create-next-app`), mas nada foi enviado a um repositório remoto.
- **Deploy na Vercel**: não foi realizado (ver DEPLOYMENT.md para o passo a
  passo e o alerta sobre o plano Hobby vs. uso comercial).
- **Domínio `designersgr.com.br`**: configuração de DNS/domínio não foi
  feita — depende do acesso ao provedor de domínio da proprietária.
- **Logo oficial**: não havia arquivo de logo na pasta; a loja usa um
  placeholder "GR" e um campo configurável (`logo_url`) em Configurações.
