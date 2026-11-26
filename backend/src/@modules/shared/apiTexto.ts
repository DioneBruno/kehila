import { ApiError } from "./apiError";

/** Aceita string, null ou undefined (-> undefined); qualquer outro tipo vira 400 em vez de estourar em .trim()/SQL. */
export function texto(valor: unknown, campo: string): string | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== "string") throw new ApiError(`Campo ${campo} inválido`);
  return valor;
}
