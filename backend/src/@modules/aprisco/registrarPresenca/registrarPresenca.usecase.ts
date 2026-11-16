import { ApiError } from "src/@modules/shared/apiError";
import { PresencaEntity, TipoPresenca, validarDataReuniao } from "./presenca.entity";
import { RegistrarPresencaRepository } from "./registrarPresencaRepository";

export type PresencaIntegranteInput = {
  /** uuid em auth_pessoas */
  pessoaUuid: string;
  /** padrão: true */
  presenca?: boolean | null;
};

export type RegistrarPresencaInput = {
  companyUuid: string;
  apriscoUuid: string;
  /** AAAA-MM-DD */
  dataReuniao: string;
  integrantes?: PresencaIntegranteInput[] | null;
  /** quantidade de crianças; null/undefined = não informado (não altera) */
  criancas?: number | null;
  /** quantidade de visitantes; null/undefined = não informado (não altera) */
  visitantes?: number | null;
};

export type RegistrarPresencaOutput = {
  uuid: string;
  tipo: TipoPresenca;
  pessoaUuid: string | null;
}[];

export class RegistrarPresencaUsecase {
  constructor(readonly repo: RegistrarPresencaRepository) {}

  async execute(input: RegistrarPresencaInput): Promise<RegistrarPresencaOutput> {
    const { companyUuid, apriscoUuid } = input;
    const dataReuniao = validarDataReuniao(input.dataReuniao);
    const integrantes = input.integrantes ?? [];
    if (!Array.isArray(integrantes)) throw new ApiError("Integrantes inválidos");

    const base = { companyUuid, apriscoUuid, dataReuniao };
    const presencas = integrantes.map((i) => PresencaEntity.criar({ ...base, tipo: "INTEGRANTE", pessoaUuid: i?.pessoaUuid, presenca: i?.presenca }));
    if (input.criancas !== null && input.criancas !== undefined) {
      presencas.push(PresencaEntity.criar({ ...base, tipo: "CRIANCA", quantidade: input.criancas }));
    }
    if (input.visitantes !== null && input.visitantes !== undefined) {
      presencas.push(PresencaEntity.criar({ ...base, tipo: "VISITANTE", quantidade: input.visitantes }));
    }
    if (!presencas.length) throw new ApiError("Nenhuma presença informada");

    const pessoaUuids = presencas.filter((p) => p.props.tipo === "INTEGRANTE").map((p) => p.props.pessoaUuid);
    if (new Set(pessoaUuids).size !== pessoaUuids.length) throw new ApiError("Integrante informado mais de uma vez");

    if (!(await this.repo.apriscoExiste(companyUuid, apriscoUuid))) throw new ApiError("Aprisco não encontrado", 404);
    if (pessoaUuids.length) {
      const existentes = await this.repo.pessoasExistentes(companyUuid, pessoaUuids);
      if (pessoaUuids.some((uuid) => !existentes.has(uuid))) throw new ApiError("Pessoa não encontrada", 404);
      const vinculados = await this.repo.integrantesDoAprisco(companyUuid, apriscoUuid, pessoaUuids);
      if (pessoaUuids.some((uuid) => !vinculados.has(uuid))) throw new ApiError("Pessoa não é integrante deste aprisco", 422);
    }

    // Registrar novamente para a mesma reunião atualiza o registro existente
    const uuids = await this.repo.salvar(presencas);
    return presencas.map((p, idx) => ({ uuid: uuids[idx], tipo: p.props.tipo, pessoaUuid: p.props.pessoaUuid }));
  }
}
