/**
 * O tema de Natal desliga sozinho à meia-noite de 25 para 26/12 (horário
 * de Brasília) — as páginas da loja são renderizadas a cada acesso, então
 * não precisa de novo deploy. Para remover o código de vez, apague esta
 * pasta e os usos de `isChristmasSeason` (busque pelo nome no projeto).
 */
export const CHRISTMAS_THEME_ENDS_AT = new Date("2026-12-26T00:00:00-03:00");

export function isChristmasSeason(now: Date = new Date()): boolean {
  return now.getTime() < CHRISTMAS_THEME_ENDS_AT.getTime();
}
