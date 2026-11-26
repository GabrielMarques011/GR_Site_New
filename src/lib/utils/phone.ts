export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Aplica a máscara (DD) 9XXXX-XXXX enquanto o usuário digita. */
export function maskBrazilianPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 2) return `(${ddd}`;
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
  }
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

/**
 * Normaliza um telefone brasileiro para E.164 (+55DDXXXXXXXXX). Aceita o
 * número com ou sem o DDI (55) já incluído. Devolve `null` se não tiver uma
 * quantidade de dígitos compatível com um número brasileiro válido.
 */
export function normalizePhoneE164(value: string): string | null {
  const digits = onlyDigits(value);

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  ) {
    return `+${digits}`;
  }

  return null;
}

/** Mostra um telefone já em E.164 no formato (DD) 9XXXX-XXXX. */
export function formatPhoneDisplay(phoneE164: string): string {
  const digits = onlyDigits(phoneE164).replace(/^55/, "");
  return maskBrazilianPhone(digits);
}
