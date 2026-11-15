import { ApiError } from "src/@modules/shared/apiError";
import { DisvincularIntegranteRepository } from "./disvincularIntegranteRepository";

export type DisvincularIntegranteInput = {
  companyUuid: string;
  apriscoUuid: string;
  /** uuid do registro em aprisco_integrantes (retornado por VincularIntegranteUsecase) */
  integranteUuid: string;
};

/** Remove (soft delete) o vínculo da pessoa com o aprisco. */
export class DisvincularIntegranteUsecase {
  constructor(readonly repo: DisvincularIntegranteRepository) {}

  async execute(input: DisvincularIntegranteInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.apriscoUuid) throw new ApiError("Aprisco não identificado");
    if (!input.integranteUuid) throw new ApiError("Integrante não identificado");

    const existe = await this.repo.integranteExiste(input.companyUuid, input.apriscoUuid, input.integranteUuid);
    if (!existe) throw new ApiError("Integrante não encontrado", 404);

    await this.repo.disvincular(input.companyUuid, input.apriscoUuid, input.integranteUuid);
  }
}
