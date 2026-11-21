const TILE_WIDTH = 360;
const TILE_HEIGHT = 46;
const BALL_COLORS = ["#d63447", "#e2a72e", "#8359af"];

function buildTile(): string {
  const swags = BALL_COLORS.map((color, i) => {
    const x0 = i * 120;
    const mid = x0 + 60;
    return `
      <path d="M${x0} 6 Q ${mid} 30 ${x0 + 120} 6" stroke="#2d6a4f" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M${x0} 6 Q ${mid} 30 ${x0 + 120} 6" stroke="#4c9a6c" stroke-width="3" stroke-dasharray="2 4" fill="none" stroke-linecap="round"/>
      <line x1="${mid}" y1="22" x2="${mid}" y2="27" stroke="#9c8f7a" stroke-width="1"/>
      <rect x="${mid - 3}" y="26" width="6" height="4" rx="1" fill="#d4a63a"/>
      <circle cx="${mid}" cy="36" r="7.5" fill="${color}"/>
      <ellipse cx="${mid - 2.5}" cy="33" rx="1.8" ry="3" fill="#fff" fill-opacity="0.45" transform="rotate(30 ${mid - 2.5} 33)"/>
    `;
  }).join("");

  // Laço vermelho em cada ponto de amarração (0 e 120/240/360). O de x=0 e
  // o de x=360 são metades que se completam quando o padrão se repete.
  const bows = [0, 120, 240, 360]
    .map(
      (x) => `
      <path d="M${x} 6 C ${x - 4} 1 ${x - 11} 0 ${x - 11} 5 C ${x - 11} 10 ${x - 4} 9 ${x} 6 Z" fill="#c1121f"/>
      <path d="M${x} 6 C ${x + 4} 1 ${x + 11} 0 ${x + 11} 5 C ${x + 11} 10 ${x + 4} 9 ${x} 6 Z" fill="#c1121f"/>
      <circle cx="${x}" cy="6" r="2.5" fill="#a10e1a"/>
    `,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_WIDTH}" height="${TILE_HEIGHT}" viewBox="0 0 ${TILE_WIDTH} ${TILE_HEIGHT}">${swags}${bows}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const TILE = buildTile();

/**
 * Guirlanda no topo do rodapé. É um padrão que se repete (background
 * repeat), em vez de um SVG esticado na largura da tela — assim as bolas e
 * os laços mantêm a proporção em qualquer tamanho de tela.
 */
export function FooterGarland() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{
        height: TILE_HEIGHT,
        backgroundImage: TILE,
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center top",
        backgroundSize: `${TILE_WIDTH}px ${TILE_HEIGHT}px`,
      }}
    />
  );
}
