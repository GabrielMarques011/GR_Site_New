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
- Temas sazonais (campanhas) com seção em destaque na home e painel de
  ativação com prazo de validade.
- Cadastro e reconhecimento de clientes: cadastro simples sem login,
  sessão persistente por dispositivo, desconto de 5% na primeira compra
  com reserva transacional, preenchimento automático no checkout, e painel
  completo de gestão de clientes (indicadores, filtros, detalhes,
  benefício, mensagens de WhatsApp preparadas/confirmadas manualmente).
- Correção do registro de pedidos no histórico (o INSERT direto estava
  bloqueado por RLS sem causa identificada — ver SECURITY.md), confirmado
  com um pedido real salvo com o desconto de primeira compra aplicado.
- Admins podem cadastrar clientes diretamente pelo painel
  (`/administracao/clientes/novo`), para clientes que não têm/não querem
  fazer o próprio cadastro.
- Login em outro aparelho simplificado para apenas o WhatsApp cadastrado,
  sem código de recuperação — troca deliberada de segurança por
  simplicidade, pedida explicitamente pelo dono do negócio (ver
  SECURITY.md).

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
- Envio automático de mensagens (aniversário, boas-vindas) via WhatsApp
  Cloud API da Meta — decisão explícita de não usar nesta versão (custo e
  complexidade de credenciais/templates aprovados); hoje o painel só
  identifica e prepara a mensagem, o envio é manual.
