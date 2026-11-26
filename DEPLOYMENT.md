# Deploy

> Nada neste documento foi executado por este ambiente — nenhum push para
> um repositório remoto foi feito e nenhum deploy na Vercel foi realizado.
> Abaixo está o passo a passo para a proprietária (ou quem for publicar)
> seguir.

## 1. Enviar o código para o GitHub

O repositório git local já existe (inicializado pelo `create-next-app`) e
`.gitignore` já exclui `.env*`, `node_modules`, `.next`, builds e chaves.
Antes do primeiro commit/push, confira que nada sensível está staged:

```bash
git status
git diff --staged
```

Depois:

```bash
git remote add origin <url-do-repositorio-no-github>
git push -u origin main
```

Crie o repositório no GitHub antes (este projeto não presume que ele já
existe).

## 2. Importar na Vercel

1. [vercel.com/new](https://vercel.com/new) → "Import Git Repository" →
   selecione o repositório.
2. Framework Preset: **Next.js** (detectado automaticamente).
3. Build Command / Output: padrão do Next.js (não precisa alterar).
4. Variáveis de ambiente (Project Settings → Environment Variables):

   | Nome                                   | Valor                                                                                | Ambientes                        |
   | -------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | `https://jcloztrhwgtvxypybzav.supabase.co`                                           | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | (chave anon do Supabase)                                                             | Production, Preview, Development |
   | `NEXT_PUBLIC_SITE_URL`                 | `https://designersgr.com.br` (ou a URL temporária da Vercel, antes do domínio final) | Production                       |

   Nenhuma chave `service_role`/secreta é necessária.

5. Deploy. A Vercel builda e publica automaticamente a cada push na branch
   principal (e cria preview deployments para outras branches/PRs).

## 3. Atenção ao plano da Vercel (uso comercial)

A GR Design é um negócio comercial. **O plano Hobby da Vercel é destinado a
uso pessoal/não comercial** — os Termos de Serviço da Vercel restringem o
plano Hobby a esse uso e preveem um plano pago (Pro ou superior) para sites
comerciais. Como os termos podem mudar, **confirme a redação atual em
vercel.com/legal/terms-of-service antes de publicar**, e não contrate um
plano pago sem autorização da proprietária — apenas avise-a dessa exigência
antes do deploy de produção.

## 4. Domínio personalizado (`designersgr.com.br`)

1. Na Vercel: Project → Settings → Domains → adicione `designersgr.com.br`
   (e, se desejar, `www.designersgr.com.br`).
2. A Vercel mostra os registros DNS necessários (geralmente um `A`/`ALIAS`
   para o domínio raiz e um `CNAME` para `www`).
3. No provedor onde o domínio `designersgr.com.br` foi registrado,
   cadastre esses registros.
4. Aguarde a propagação de DNS (pode levar de minutos a algumas horas) e
   confirme o certificado HTTPS automático da Vercel.
5. Atualize `NEXT_PUBLIC_SITE_URL` para `https://designersgr.com.br` em
   produção.

## 5. Verificação pós-deploy

- [ ] Home carrega com as configurações reais da loja
- [ ] Login dos dois administradores funciona em produção
- [ ] Upload de imagem funciona (bucket `products-images` em produção)
- [ ] "Finalizar pelo WhatsApp" abre o número correto
- [ ] HTTPS ativo no domínio final
- [ ] Nenhuma chave secreta aparece no bundle (`view-source` / aba Network)
- [ ] Cadastro em `/cadastro` funciona e o cookie de sessão é `Secure` em
      produção (confirmar nas DevTools → Application → Cookies)
- [ ] `supabase/migrations/0004_customers.sql` aplicada antes de divulgar o
      cadastro de clientes (sem ela, a loja funciona normal, só sem
      reconhecimento)

## 6. Limites do plano gratuito a observar

- **Supabase Free**: limite de armazenamento de banco e Storage, número de
  usuários autenticados, e o banco pode pausar após um período de
  inatividade prolongado — monitore no Dashboard do Supabase.
- **Vercel**: limite de execuções/bandwidth de funções serverless no plano
  contratado — monitore em Project → Usage.
- Nenhum backup automático de longo prazo está configurado. Recomenda-se
  exportar periodicamente o banco (`Database → Backups` no Supabase, ou
  `pg_dump` manual) — o plano Free do Supabase não garante retenção de
  backups por padrão.

## 7. Atualizações futuras

Depois do primeiro deploy, novas funcionalidades seguem o fluxo normal:
commit → push → a Vercel builda e publica automaticamente. Mudanças de
banco devem continuar passando por `supabase/migrations/` (ver
DATABASE.md), revisadas e aplicadas manualmente — nunca automaticamente a
partir do deploy.
