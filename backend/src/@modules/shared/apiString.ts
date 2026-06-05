import { randomInt } from "crypto";
export class ApiString {
  static slug(text: string) {
    if (!text) return "";
    return text
      .trim() // Remove espaços extras
      .normalize("NFD") // Normaliza caracteres acentuados
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase() // Converte para minúsculas
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/[^a-z0-9-]/g, ""); // Remove caracteres especiais
  }

  static gerarCodigo() {
    return randomInt(100000, 999999);
  }

  static ocultarCpfCnpj(cpfCnpj: string) {
    if (!cpfCnpj) return "";
    if (cpfCnpj.length < 14) return cpfCnpj.replace(/^(\d{3})\d{3}\d{3}(\d{2})$/, "$1.***.***-$2");
    return cpfCnpj.replace(/^(\d{2})\d{3}\d{3}\d{4}(\d{2})$/, "$1.***.***/****-$2");
  }

  static ocultarEmail(email: string) {
    if (!email) return "";
    const [usuario, dominio] = email.split("@");
    if (usuario.length <= 3) {
      // caso email curto, mostra só o primeiro e último
      return usuario[0] + "*".repeat(usuario.length - 1) + "@" + dominio;
    }

    const inicio = usuario.slice(0, 2);
    const fim = usuario.slice(-1);
    const meio = "*".repeat(usuario.length - 3);

    return `${inicio}${meio}${fim}@${dominio}`;
  }

  static ocultarTelefone(numero: string, ddd?: string, ddi?: string) {
    if (!numero) return "";
    const n = numero.replace(/[^0-9]/g, "");
    let response = n.replace(/^(\d{2})\d+(\d{2})$/, "$1*****$2");
    if (ddd) response = `(${ddd}) ${response}`;
    if (ddi) response = `+${ddi} ${response}`;
    return response;
  }

  static normalizar(text: string) {
    if (!text?.length) return null;
    return text
      .normalize("NFD")
      .replace(/[ºª]/gi, "")
      .replace(/[']/gi, "")
      .replace(/Nº/gi, "N")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .replace(/`/g, " ")
      .replace(/´/g, " ")
      .replace(/"/g, " ")
      .replace(/[^\x00-\x7F]/g, "") // remove qualquer não-ASCII
      .trim();
  }

  static normalizarMaiusculo(text: string) {
    if (!text?.length) return null;
    return ApiString.normalizar(text)?.toUpperCase();
  }
}
