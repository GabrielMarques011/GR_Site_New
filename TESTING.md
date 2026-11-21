# Testes e qualidade

## O que foi executado neste ambiente (resultados reais)

| Verificação       | Comando            | Resultado                                                                                                             |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| TypeScript        | `npx tsc --noEmit` | ✅ sem erros                                                                                                          |
| ESLint            | `npx eslint .`     | ✅ 0 erros (2 warnings esperados, ver nota)                                                                           |
| Build de produção | `npm run build`    | ✅ compilou e gerou todas as rotas (testado com uma chave Supabase de placeholder só para validar o build — ver nota) |
| Testes unitários  | `npm run test`     | ✅ 15/15 passando                                                                                                     |
| Testes end-to-end | `npm run test:e2e` | ⚠️ **não executados** — precisam da chave real do Supabase e de produtos/categorias cadastrados (ver abaixo)          |

**Nota sobre os 2 warnings do ESLint**: são do `react-hooks/incompatible-library`,
avisando que o React Compiler não consegue memoizar o retorno de
`useForm().watch` do React Hook Form — é um comportamento esperado e
documentado da biblioteca, não um bug do projeto.

**Nota sobre o build de produção**: para confirmar que o projeto realmente
compila e gera todas as rotas, uma chave de placeholder
(`sb_publishable_placeholder_for_local_build_test`) foi usada
_temporariamente_ durante o build, só neste ambiente de desenvolvimento, e
removida em seguida — `.env.local` foi restaurado sem nenhuma chave real.
Isso **não é o mesmo que testar a conexão real com o Supabase**: nenhuma
leitura/escrita de dados foi feita contra o projeto remoto. Todas as rotas
de dados compilaram como dinâmicas (`ƒ`), confirmando que nenhuma delas
tenta buscar dados em tempo de build.

**Não foi afirmado nem simulado**: conexão real com o Supabase, login real
dos dois administradores, upload real de imagem no Storage, ou deploy na
Vercel. Nenhum desses foi testado porque este ambiente não tem a chave
anon do projeto nem acesso à Vercel/GitHub remotos.

## Testes unitários (Vitest)

`tests/unit/`:

- `pricing.test.ts` — `computeProductPricing`: promoção sem data, antes do
  início, depois do fim, dentro da janela, e preço promocional inválido
  (maior que o preço normal).
- `whatsapp.test.ts` — geração da mensagem de pedido e da URL `wa.me`
  (normalização do telefone).
- `slugify.test.ts` — remoção de acentos, caracteres especiais e hífens
  duplicados.
- `product-validation.test.ts` — regras do schema Zod de produto (slug
  inválido, preço promocional ≥ preço normal, datas de promoção invertidas).

Rodar: `npm run test` (ou `npm run test:watch` durante o desenvolvimento).

## Testes end-to-end (Playwright)

`tests/e2e/store.spec.ts` cobre: carregamento da home, navegação até
`/produtos`, busca no catálogo, carrinho vazio, e redirecionamento de
`/administracao` para o login quando não autenticado.

Para rodar de verdade:

```bash
cp .env.example .env.local   # preencha a chave real
npm run test:e2e
```

Esses testes **dependem de haver pelo menos um produto ativo e uma
categoria cadastrados no banco** para alguns cenários fazerem sentido
visualmente (a suíte atual testa principalmente navegação e UI, não dados
específicos — mas uma suíte mais completa de regressão deveria, depois,
also cobrir login do admin, criação de produto e upload de imagem contra
um projeto Supabase de teste/staging, não o de produção).

## Checklist manual recomendado antes de divulgar o site

Use esta lista para validar manualmente o que testes automatizados não
cobrem sozinhos (aparência real, upload de arquivo, WhatsApp de verdade):

- [ ] Catálogo carrega produtos reais, busca e filtros funcionam
- [ ] Preço promocional aparece e some corretamente nas datas certas
- [ ] Adicionar/remover/alterar quantidade no carrinho atualiza o total
- [ ] "Finalizar pelo WhatsApp" abre o WhatsApp com a mensagem correta
- [ ] Login dos dois administradores reais funciona e desloga corretamente
- [ ] Um usuário autenticado sem linha em `admin_profiles` não acessa o painel
- [ ] Criar/editar/excluir produto e categoria no painel reflete na loja
- [ ] Upload de imagem aparece na loja em WebP, sem arquivo órfão após excluir
- [ ] Editar Configurações atualiza nome/slogan/contato em toda a loja
- [ ] Responsividade em um celular real (não só DevTools)
- [ ] Lighthouse/acessibilidade básica (contraste, navegação por teclado)
