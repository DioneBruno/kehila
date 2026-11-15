import { ApiError } from "src/@modules/shared/apiError";
import { VinculoEntity } from "./vinculo.entity";
import { VinculoEntreMembrosRepository } from "./vinculoEntreMembrosRepository";

export type VincularMembrosInput = {
  companyUuid: string;
  /** Membro principal */
  membroUuid: string;
  vinculos: {
    /** Membro que será vinculado ao principal */
    membroVinculadoUuid: string;
    /** O que o membro vinculado é do principal (PAI, MAE, FILHO...) */
    tipo: string;
    /** O que o principal é do membro vinculado. Se omitido, usa o inverso padrão do tipo. */
    tipoInverso?: string | null;
  }[];
};

export type VincularMembrosOutput = {
  uuids: string[];
};

export class VinculoEntreMembrosUsecase {
  constructor(readonly repo: VinculoEntreMembrosRepository) {}

  async execute(input: VincularMembrosInput): Promise<VincularMembrosOutput> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.membroUuid) throw new ApiError("Membro não identificado");
    if (!input.vinculos?.length) throw new ApiError("Informe ao menos um vínculo");

    const pares = input.vinculos.map((v) =>
      VinculoEntity.criarPar({
        companyUuid: input.companyUuid,
        pessoaUuid: input.membroUuid,
        pessoaVinculadaUuid: v.membroVinculadoUuid,
        tipo: v.tipo,
        tipoInverso: v.tipoInverso,
      }),
    );

    const vinculados = pares.map(([direto]) => direto.props.pessoaVinculadaUuid);
    if (new Set(vinculados).size !== vinculados.length) throw new ApiError("Um mesmo membro foi informado mais de uma vez");

    const membros = [input.membroUuid, ...vinculados];
    const existentes = await this.repo.contarMembrosExistentes(input.companyUuid, membros);
    if (existentes !== membros.length) throw new ApiError("Membro não encontrado", 404);

    for (const vinculado of vinculados) {
      if (await this.repo.vinculoExiste(input.companyUuid, input.membroUuid, vinculado)) {
        throw new ApiError("Já existe um vínculo entre esses membros", 409);
      }
    }

    await this.repo.incluir(pares.flat());

    return { uuids: pares.map(([direto]) => direto.uuid) };
  }
}
