# Plano do projeto

## Fases (conforme o briefing) e status

| Fase                          | Status                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Análise e planejamento     | ✅ Concluída (pasta inspecionada, vazia; arquitetura e estrutura definidas)                                                                                                                  |
| 2. Estrutura do Next.js       | ✅ Concluída (App Router, TypeScript, Tailwind v4, lint, estrutura de pastas)                                                                                                                |
| 3. Integração Supabase        | ⚠️ Parcial — clientes, tipos e serviços implementados; **conexão real não testada** (sem chave anon fornecida); auditoria de RLS feita de forma estática + migration proposta (não aplicada) |
| 4. Loja pública               | ✅ Concluída                                                                                                                                                                                 |
| 5. Carrinho                   | ✅ Concluída                                                                                                                                                                                 |
| 6. Administração              | ✅ Concluída                                                                                                                                                                                 |
| 7. Segurança e qualidade      | ⚠️ Parcial — `tsc`, `eslint`, build e testes unitários passam; testes end-to-end e verificação de autorização real dependem de credenciais reais (ver TESTING.md)                            |
| 8. Preparação para publicação | ⚠️ Parcial — projeto pronto para deploy; push ao GitHub e deploy na Vercel não foram feitos (ver DEPLOYMENT.md)                                                                              |

## Por que as fases 3, 7 e 8 ficaram parciais

Este ambiente de desenvolvimento nunca recebeu:

1. A chave publicável/anon real do projeto Supabase.
2. Um repositório remoto no GitHub para enviar o código.
3. Acesso a uma conta Vercel para deploy.

Essas três coisas são, por natureza, credenciais/decisões que pertencem à
proprietária do negócio — o código e a documentação estão prontos para que
ela (ou quem for operar) complete esses passos seguindo README.md e
DEPLOYMENT.md.

## Linha do tempo real desta sessão

1. Pasta vazia confirmada (nenhum projeto pré-existente).
2. Scaffold do Next.js (App Router, TypeScript, Tailwind v4) + dependências
   (`@supabase/supabase-js`, `@supabase/ssr`, zod, react-hook-form, lucide,
   sharp, vitest, playwright).
3. Tipos do banco, clientes Supabase (browser/server/middleware), camada de
   serviços, validações Zod.
4. Identidade visual (paleta lilás, tipografia, componentes base).
5. Loja pública completa.
6. Carrinho com recálculo no servidor.
7. Painel administrativo completo (login, dashboard, produtos, categorias,
   imagens, configurações, auditoria).
8. Correção de erros de tipos (TypeScript + Supabase + React Hook Form +
   Zod v4) até `tsc`, `eslint` e `next build` passarem limpos.
9. Testes unitários escritos e executados com sucesso; testes end-to-end
   escritos (não executados, por falta de credencial).
10. Migration de segurança proposta (não aplicada) e documentação completa.
