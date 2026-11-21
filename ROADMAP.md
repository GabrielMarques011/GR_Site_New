# Roadmap

## Concluído nesta etapa

- Loja pública completa (início, catálogo com busca/filtro/ordenação,
  produto, categorias, sobre, contato, carrinho com checkout via WhatsApp).
- Painel administrativo completo (login, dashboard, produtos, categorias,
  imagens, promoções, configurações, auditoria).
- Identidade visual própria (lilás) e design system documentado.
- Camada de dados Supabase (tipos, clientes, serviços) e proposta de
  auditoria de segurança (migration não aplicada).
- Testes unitários cobrindo as regras de negócio mais sensíveis (preço,
  promoção, validação, mensagem de WhatsApp).
- Documentação completa do projeto.

## Pendente — depende de ação da proprietária/configuração externa

- [ ] Fornecer a chave anon/publicável real do Supabase e validar a
      conexão de ponta a ponta.
- [ ] Revisar e aplicar `supabase/migrations/0001_security_hardening.sql`.
- [ ] Criar repositório no GitHub e enviar o código (ver DEPLOYMENT.md).
- [ ] Deploy na Vercel + configuração de domínio `designersgr.com.br`.
- [ ] Confirmar o plano da Vercel adequado para uso comercial.
- [ ] Fornecer a logo oficial (ou aprovar o placeholder "GR").
- [ ] Cadastrar o catálogo real de produtos e categorias pelo painel.
- [ ] Preencher Configurações (texto institucional, WhatsApp, Instagram,
      endereço, link do mapa) com os dados definitivos.

## Ideias para versões futuras (não implementadas — fora do escopo pedido)

- Pagamento online (explicitamente fora do escopo desta versão).
- Múltiplas variações de produto (cor/tamanho) como entidades próprias,
  caso o catálogo cresça nessa direção.
- Função/view no Postgres para ordenar por preço efetivo diretamente no
  banco, se o catálogo crescer a ponto de a ordenação em memória (ver
  ARCHITECTURE.md) deixar de ser eficiente.
- Página de confirmação de pedido com número de protocolo (hoje o pedido é
  só a mensagem de WhatsApp).
- Internacionalização (hoje o site é 100% em português, para o público da
  GR Design).
- Notificações por e-mail para a proprietária a cada novo pedido via
  WhatsApp (hoje o WhatsApp já cumpre esse papel).
