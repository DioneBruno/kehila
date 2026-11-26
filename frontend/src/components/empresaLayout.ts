/** Campos editáveis de `auth_companies.layout`. Vazio = usa o padrão do `/ping`. */
export type LayoutSecaoForm = { titulo: string; subTitulo: string };
export type LayoutForm = { header: LayoutSecaoForm; telaLogin: LayoutSecaoForm };

/** Padrões aplicados pelo backend (`LayoutQuery`) quando o campo está vazio. */
export const LAYOUT_PADRAO: LayoutForm = {
  header: { titulo: "Kehila", subTitulo: "" },
  telaLogin: { titulo: "Kehila", subTitulo: "Bem-vindo" },
};

const texto = (v: unknown) => (typeof v === "string" ? v : "");

export function layoutParaForm(layout: any): LayoutForm {
  return {
    header: { titulo: texto(layout?.header?.titulo), subTitulo: texto(layout?.header?.subTitulo) },
    telaLogin: { titulo: texto(layout?.telaLogin?.titulo), subTitulo: texto(layout?.telaLogin?.subTitulo) },
  };
}
