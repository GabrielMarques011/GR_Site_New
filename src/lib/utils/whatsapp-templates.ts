export interface TemplateVariables {
  nome: string;
  telefone?: string;
  data_nascimento?: string;
}

/** Substitui {nome}/{telefone}/{data_nascimento} pelo conteúdo real. */
export function renderWhatsAppTemplate(
  content: string,
  vars: TemplateVariables,
): string {
  return content
    .replaceAll("{nome}", vars.nome)
    .replaceAll("{telefone}", vars.telefone ?? "")
    .replaceAll("{data_nascimento}", vars.data_nascimento ?? "");
}
