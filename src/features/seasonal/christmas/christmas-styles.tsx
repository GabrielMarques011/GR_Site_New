const CSS = `
@keyframes xmas-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes xmas-sway { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes xmas-sparkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1); }
}
/* Anima "top" (e não translateY em %), porque % de translate é relativo ao
   próprio floco (poucos px) — o floco quase não se movia. */
@keyframes xmas-snowfall {
  0% { top: -8px; transform: translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; transform: translateX(var(--xmas-drift, 20px)); opacity: 0; }
}
.xmas-bulb { filter: drop-shadow(0 0 3px currentColor); animation: xmas-twinkle 1.8s ease-in-out infinite; }
.xmas-sway { transform-origin: top center; animation: xmas-sway 3.4s ease-in-out infinite; }
.xmas-sparkle { animation: xmas-sparkle 2.6s ease-in-out infinite; }
.xmas-snowflake { animation-name: xmas-snowfall; animation-timing-function: linear; animation-iteration-count: infinite; }
@media (prefers-reduced-motion: reduce) {
  .xmas-bulb, .xmas-sway, .xmas-sparkle, .xmas-snowflake { animation: none; }
}
`;

export function ChristmasStyles() {
  return <style>{CSS}</style>;
}
