import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";

export const PAPEIS_INTEGRANTE = ["LIDER", "AUXILIAR", "ANFITRIAO", "MEMBRO"] as const;

export type PapelIntegrante = (typeof PAPEIS_INTEGRANTE)[number];

export type IntegranteProps = {
  uuid: string;
  companyUuid: string;
  apriscoUuid: string;
  pessoaUuid: string;
  papel: PapelIntegrante;
};

export type CriarIntegranteProps = {
  companyUuid: string;
  apriscoUuid: string;
  pessoaUuid: string;
  papel?: string | null;
};

export function normalizarPapelIntegrante(papel: string | null | undefined): PapelIntegrante {
  const normalizado = (papel?.trim().toUpperCase() || "MEMBRO") as PapelIntegrante;
  if (!PAPEIS_INTEGRANTE.includes(normalizado)) {
    throw new ApiError(`Papel inválido. Valores aceitos: ${PAPEIS_INTEGRANTE.join(", ")}`);
  }
  return normalizado;
}

export class IntegranteEntity {
  constructor(readonly props: IntegranteProps) {}

  static criar(input: CriarIntegranteProps): IntegranteEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.apriscoUuid) throw new ApiError("Aprisco não identificado");
    if (!input.pessoaUuid) throw new ApiError("Pessoa não identificada");

    return new IntegranteEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      apriscoUuid: input.apriscoUuid,
      pessoaUuid: input.pessoaUuid,
      papel: normalizarPapelIntegrante(input.papel),
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}
