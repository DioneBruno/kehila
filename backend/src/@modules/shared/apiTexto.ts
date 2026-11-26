import { ApiError } from "./apiError";

/** Aceita string, null ou undefined (-> undefined); qualquer outro tipo vira 400 em vez de estourar em .trim()/SQL. */
export function texto(valor: unknown, campo: string): string | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== "string") throw new ApiError(`Campo ${campo} inválido`);
  return valor;
}

/** Aceita undefined/null (-> undefined) ou array de strings; qualquer outra coisa vira 400. */
export function listaTexto(valor: unknown, campo: string): string[] | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (!Array.isArray(valor) || valor.some((v) => typeof v !== "string")) throw new ApiError(`Campo ${campo} inválido`);
  return valor;
}

/** Para campos que podem ser limpos: undefined = não altera; null ou vazio = limpa (null); string = valor aparado. */
export function textoLimpavel(valor: unknown, campo: string): string | null | undefined {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  if (typeof valor !== "string") throw new ApiError(`Campo ${campo} inválido`);
  return valor.trim() || null;
}
