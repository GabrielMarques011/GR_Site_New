/**
 * Gera um embed do Google Maps sem precisar de chave de API nem custo —
 * usa o endereço cadastrado em Configurações. Se a loja configurar um link
 * de incorporação próprio (`maps_url`, em Configurações), ele é priorizado.
 */
export function buildMapsEmbedUrl(
  address: string,
  customUrl: string | null,
): string {
  if (customUrl) return customUrl;
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

/** Link universal do Google Maps (abre o app no celular ou o site no desktop). */
export function buildMapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
