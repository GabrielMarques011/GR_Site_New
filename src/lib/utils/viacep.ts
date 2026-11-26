export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export interface ViaCepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Consulta o ViaCEP (API pública, sem chave) para preencher o endereço
 * automaticamente a partir do CEP. Devolve `null` em qualquer falha (CEP
 * inválido, inexistente ou erro de rede) — o cliente sempre pode preencher
 * o endereço manualmente nesse caso.
 */
export async function fetchAddressByCep(
  cep: string,
): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (data.erro) return null;

    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
