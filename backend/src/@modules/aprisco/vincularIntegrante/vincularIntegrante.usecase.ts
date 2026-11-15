import { ApiError } from "src/@modules/shared/apiError";
import { IntegranteEntity } from "./integrante.entity";
import { VincularIntegranteRepository } from "./vincularIntegranteRepository";

export type VincularIntegranteInput = {
  companyUuid: string;
  apriscoUuid: string;
  /** uuid em auth_pessoas */
  pessoaUuid: string;
  /** LIDER, AUXILIAR, ANFITRIAO ou MEMBRO (padrão) */
  papel?: string | null;
};

export type VincularIntegranteOutput = {
  uuid: string;
};

export class VincularIntegranteUsecase {
  constructor(readonly repo: VincularIntegranteRepository) {}

  async execute(input: VincularIntegranteInput): Promise<VincularIntegranteOutput> {
    const integrante = IntegranteEntity.criar(input);
    const { companyUuid, apriscoUuid, pessoaUuid } = integrante.props;

    if (!(await this.repo.apriscoExiste(companyUuid, apriscoUuid))) throw new ApiError("Aprisco não encontrado", 404);
    if (!(await this.repo.pessoaExiste(companyUuid, pessoaUuid))) throw new ApiError("Pessoa não encontrada", 404);
    if (await this.repo.vinculoExiste(companyUuid, apriscoUuid, pessoaUuid)) {
      throw new ApiError("Pessoa já é integrante deste aprisco", 409);
    }

    await this.repo.incluir(integrante);
    return { uuid: integrante.uuid };
  }
}
