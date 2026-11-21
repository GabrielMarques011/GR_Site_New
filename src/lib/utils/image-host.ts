const ALLOWED_HOSTNAMES = ["jcloztrhwgtvxypybzav.supabase.co"];

/**
 * `next/image` derruba a página inteira com um erro não tratado quando o
 * host de `src` não está na allowlist de `next.config.ts` (ex.: alguém cola
 * o link de um post do Instagram em vez de uma imagem). Como só o Storage
 * do Supabase está liberado, qualquer imagem vinda de upload sempre passa
 * aqui — isso serve de rede de segurança para dado antigo/editado na mão.
 */
export function isAllowedImageUrl(
  url: string | null | undefined,
): url is string {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return ALLOWED_HOSTNAMES.includes(hostname);
  } catch {
    return false;
  }
}
