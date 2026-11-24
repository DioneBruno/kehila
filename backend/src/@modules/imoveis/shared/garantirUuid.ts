import { ApiError } from "src/@modules/shared/apiError";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Evita que um uuid malformado chegue ao Postgres (22P02 -> 500): responde 404 com a mensagem da entidade. */
export function garantirUuid(valor: unknown, mensagem404: string): string {
  if (typeof valor !== "string" || !UUID_REGEX.test(valor)) throw new ApiError(mensagem404, 404);
  return valor;
}
