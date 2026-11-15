import { ApiError } from "src/@modules/shared/apiError";
import { PresencaEntity } from "./presenca.entity";
import { RegistrarPresencaRepository } from "./registrarPresencaRepository";

export type RegistrarPresencaInput = {
  companyUuid: string;
  apriscoUuid: string;
  /** INTEGRANTE, CRIANCA (aceita "criança") ou VISITANTE */
  tipo: string;
  /** uuid em auth_pessoas — obrigatório para INTEGRANTE, opcional para os demais */
  pessoaUuid?: string | null;
  /** AAAA-MM-DD */
  dataReuniao: string;
  /** padrão: true */
  presenca?: boolean | null;
  /** obrigatório para CRIANCA/VISITANTE sem pessoa (com pessoa, padrão 1); ignorado para INTEGRANTE */
  quantidade?: number | null;
};

export type RegistrarPresencaOutput = {
  uuid: string;
};

export class RegistrarPresencaUsecase {
  constructor(readonly repo: RegistrarPresencaRepository) {}

  async execute(input: RegistrarPresencaInput): Promise<RegistrarPresencaOutput> {
    const presenca = PresencaEntity.criar(input);
    const { companyUuid, apriscoUuid, pessoaUuid, tipo } = presenca.props;

    if (!(await this.repo.apriscoExiste(companyUuid, apriscoUuid))) throw new ApiError("Aprisco não encontrado", 404);
    if (pessoaUuid && !(await this.repo.pessoaExiste(companyUuid, pessoaUuid))) throw new ApiError("Pessoa não encontrada", 404);
    if (tipo === "INTEGRANTE" && !(await this.repo.integranteExiste(companyUuid, apriscoUuid, pessoaUuid))) {
      throw new ApiError("Pessoa não é integrante deste aprisco", 422);
    }

    // Registrar novamente para a mesma reunião atualiza o registro existente
    const existenteUuid = await this.repo.buscarExistente(presenca);
    if (existenteUuid) {
      await this.repo.atualizar(existenteUuid, presenca);
      return { uuid: existenteUuid };
    }

    await this.repo.incluir(presenca);
    return { uuid: presenca.uuid };
  }
}
