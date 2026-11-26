import { ApiError } from "src/@modules/shared/apiError";

export type LayoutSecao = { titulo: string | null; subTitulo: string | null };
export type LayoutEmpresa = { header?: LayoutSecao; telaLogin?: LayoutSecao };

const SECOES = ["header", "telaLogin"] as const;
const CAMPOS = ["titulo", "subTitulo"] as const;
const TAMANHO_MAXIMO = 120;

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Valida o `layout` enviado na edição da empresa. undefined/null = não altera.
 * Só aceita as seções `header` e `telaLogin` com `titulo`/`subTitulo` texto; vazio vira null
 * (o `/ping` então usa o padrão). Seções ausentes ficam como estão no banco.
 */
export function normalizarLayout(valor: unknown): LayoutEmpresa | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (!ehObjeto(valor)) throw new ApiError("Campo layout inválido");

  const layout: LayoutEmpresa = {};
  for (const secao of SECOES) {
    const bruto = valor[secao];
    if (bruto === undefined || bruto === null) continue;
    if (!ehObjeto(bruto)) throw new ApiError(`Campo layout.${secao} inválido`);

    const resultado = {} as LayoutSecao;
    for (const campo of CAMPOS) {
      const v = bruto[campo];
      if (v !== undefined && v !== null && typeof v !== "string") throw new ApiError(`Campo layout.${secao}.${campo} inválido`);
      const limpo = typeof v === "string" ? v.trim() : "";
      if (limpo.length > TAMANHO_MAXIMO) throw new ApiError(`Campo layout.${secao}.${campo} deve ter no máximo ${TAMANHO_MAXIMO} caracteres`);
      resultado[campo] = limpo || null;
    }
    layout[secao] = resultado;
  }
  return layout;
}
