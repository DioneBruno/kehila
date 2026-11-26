import { ApiError } from "src/@modules/shared/apiError";

export const MODULOS_VALIDOS = ["igreja", "imoveis", "admin"] as const;
export type ModuloChave = (typeof MODULOS_VALIDOS)[number];

export function validarModulos(modulos: unknown): ModuloChave[] {
  if (!Array.isArray(modulos) || modulos.length === 0) throw new ApiError("Informe pelo menos um módulo");
  for (const modulo of modulos) {
    if (!MODULOS_VALIDOS.includes(modulo as ModuloChave)) throw new ApiError(`Módulo inválido: ${modulo}`);
  }
  return [...new Set(modulos as ModuloChave[])];
}
