# Design System — GR Design

Identidade visual própria, criada para este projeto (não há logo oficial na
pasta — ver "Logo" abaixo).

## Paleta (definida em `src/app/globals.css`)

| Token                            | Hex                          | Uso                                                                     |
| -------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `lilac-50`…`lilac-200`           | `#faf8fc` → `#e6dbf2`        | fundos suaves, cards de destaque                                        |
| `lilac-400`/`lilac-500`          | `#b896d9` / `#9b6fc7`        | acentos, badges                                                         |
| `lilac-600`/`lilac-700`          | `#8359af` / `#6a4590`        | botões primários, links, títulos                                        |
| `lilac-800`/`lilac-900`          | `#503470` / `#392750`        | hover states, texto sobre fundo lilás                                   |
| `ink-50`…`ink-900`               | neutros levemente arroxeados | texto e fundos neutros (em vez de cinza puro, para manter a identidade) |
| `success` / `danger` / `warning` | verde / vermelho / âmbar     | feedback de formulários e badges de status                              |

Todas as cores viram utilitários Tailwind (`bg-lilac-600`, `text-ink-700`
etc.) via `@theme inline` em `globals.css`.

## Tipografia

- **Corpo de texto**: Inter (`font-sans`, via `next/font/google`).
- **Títulos/destaques**: Poppins (`font-display`), pesos 500/600/700 — dá
  um toque mais autoral/afetivo aos títulos sem perder legibilidade.

## Componentes base (`src/components/ui/`)

`Button` (+ `buttonVariants` para estilizar `<Link>`/`<a>` como botão),
`Badge`, `Card`/`CardHeader`/`CardBody`, `Input`, `Textarea`, `Select`,
`Field` (label + erro + hint), `Alert` (success/danger/info/warning),
`Skeleton`.

Convenções:

- Cantos arredondados (`rounded-lg`/`rounded-xl`/`rounded-2xl`), sombras
  discretas (`shadow-sm`), nunca sombras pesadas.
- Todo elemento focável usa a classe utilitária `.focus-ring` (anel lilás
  consistente, acessível por teclado).
- Estados de carregamento via `isLoading` no `Button` (spinner inline) e
  `Skeleton` para conteúdo assíncrono.
- Mensagens de sucesso/erro sempre via `<Alert>`, nunca `alert()` do
  navegador (exceto confirmações destrutivas no painel — exclusão de
  produto/categoria —, que usam `window.confirm` por simplicidade).

## Logo

Não havia arquivo de logo na pasta do projeto. O cabeçalho da loja e o
painel mostram um placeholder circular com "GR" sempre que
`store_settings.logo_url` estiver vazio, e trocam automaticamente pela
logo real assim que uma URL for configurada em
Administração → Configurações.
