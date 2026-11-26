/** Campos editáveis de `auth_companies.layout`. Vazio = usa o padrão do `/ping`. */
export type LayoutSecaoForm = { titulo: string; subTitulo: string };
export type LayoutForm = { header: LayoutSecaoForm; telaLogin: LayoutSecaoForm };

/** Padrões aplicados pelo backend (`LayoutQuery`) quando o campo está vazio. */
export const LAYOUT_PADRAO: LayoutForm = {
  header: { titulo: "Kehila", subTitulo: "" },
  telaLogin: { titulo: "Kehila", subTitulo: "Bem-vindo" },
};

/** Fundo da tela de login quando a empresa não enviou imagem. */
export const IMAGEM_LOGIN_PADRAO =
  "https://ministeriofiel.com.br/wp-content/uploads/2023/04/orac%CC%A7a%CC%83o-1.png";
export const IMAGEM_LOGIN_TIPOS = "image/png,image/jpeg,image/webp";
export const IMAGEM_LOGIN_TAMANHO_MAXIMO = 5 * 1024 * 1024;

export function formDataImagemLogin(arquivo: File) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  return form;
}

const texto =(v: unknown) => (typeof v === "string" ? v : "");

export function layoutParaForm(layout: any): LayoutForm {
  return {
    header: { titulo: texto(layout?.header?.titulo), subTitulo: texto(layout?.header?.subTitulo) },
    telaLogin: { titulo: texto(layout?.telaLogin?.titulo), subTitulo: texto(layout?.telaLogin?.subTitulo) },
  };
}
