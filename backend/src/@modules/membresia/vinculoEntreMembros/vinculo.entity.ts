import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";

export const TIPOS_VINCULO = ["PAI", "MAE", "FILHO", "FILHA", "CONJUGE", "IRMAO", "IRMA", "AVO", "NETO", "NETA", "TIO", "TIA", "SOBRINHO", "SOBRINHA", "OUTRO"] as const;

export type TipoVinculo = (typeof TIPOS_VINCULO)[number];

/**
 * Inversos aceitos para cada tipo. O primeiro é o padrão.
 * Como o sexo do membro não é cadastrado, quem chama pode escolher (ex.: PAI -> FILHO ou FILHA).
 */
export const INVERSOS_VINCULO: Record<TipoVinculo, TipoVinculo[]> = {
  PAI: ["FILHO", "FILHA"],
  MAE: ["FILHO", "FILHA"],
  FILHO: ["PAI", "MAE"],
  FILHA: ["PAI", "MAE"],
  CONJUGE: ["CONJUGE"],
  IRMAO: ["IRMAO", "IRMA"],
  IRMA: ["IRMAO", "IRMA"],
  AVO: ["NETO", "NETA"],
  NETO: ["AVO"],
  NETA: ["AVO"],
  TIO: ["SOBRINHO", "SOBRINHA"],
  TIA: ["SOBRINHO", "SOBRINHA"],
  SOBRINHO: ["TIO", "TIA"],
  SOBRINHA: ["TIO", "TIA"],
  OUTRO: ["OUTRO"],
};

/**
 * Lê-se: "pessoaVinculada é <tipo> de pessoa".
 * Ex.: { pessoa: João, pessoaVinculada: Maria, tipo: "MAE" } => Maria é mãe de João.
 */
export type VinculoProps = {
  uuid: string;
  companyUuid: string;
  pessoaUuid: string;
  pessoaVinculadaUuid: string;
  tipo: TipoVinculo;
};

export type CriarVinculoProps = {
  companyUuid: string;
  pessoaUuid: string;
  pessoaVinculadaUuid: string;
  tipo: string;
  tipoInverso?: string | null;
};

function normalizarTipo(tipo: string | null | undefined): TipoVinculo | undefined {
  return tipo?.trim().toUpperCase() as TipoVinculo | undefined;
}

export class VinculoEntity {
  constructor(readonly props: VinculoProps) {}

  /** Cria o vínculo direto e o inverso (ex.: Carlos é PAI de João  +  João é FILHO de Carlos). */
  static criarPar(input: CriarVinculoProps): [VinculoEntity, VinculoEntity] {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.pessoaUuid) throw new ApiError("Membro não identificado");
    if (!input.pessoaVinculadaUuid) throw new ApiError("Membro vinculado não identificado");
    if (input.pessoaUuid === input.pessoaVinculadaUuid) throw new ApiError("Um membro não pode ser vinculado a ele mesmo");

    const tipo = normalizarTipo(input.tipo);
    if (!tipo || !TIPOS_VINCULO.includes(tipo)) throw new ApiError(`Tipo de vínculo inválido. Valores aceitos: ${TIPOS_VINCULO.join(", ")}`);

    const inversosAceitos = INVERSOS_VINCULO[tipo];
    const tipoInverso = normalizarTipo(input.tipoInverso) || inversosAceitos[0];
    if (!inversosAceitos.includes(tipoInverso)) {
      throw new ApiError(`Tipo inverso inválido para ${tipo}. Valores aceitos: ${inversosAceitos.join(", ")}`);
    }

    const direto = new VinculoEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      pessoaUuid: input.pessoaUuid,
      pessoaVinculadaUuid: input.pessoaVinculadaUuid,
      tipo,
    });
    const inverso = new VinculoEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      pessoaUuid: input.pessoaVinculadaUuid,
      pessoaVinculadaUuid: input.pessoaUuid,
      tipo: tipoInverso,
    });
    return [direto, inverso];
  }

  get uuid() {
    return this.props.uuid;
  }
}
