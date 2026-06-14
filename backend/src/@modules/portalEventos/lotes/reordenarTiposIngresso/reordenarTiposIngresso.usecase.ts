import { ApiError } from "src/@modules/shared/apiError";
import { ReordenarTiposIngressoRepository } from "./reordenarTiposIngressoRepository";

export type ReordenarTiposIngressoInput = {
  companyUuid: string;
  tipos: { uuid: string; ordem: number }[];
};

export class ReordenarTiposIngressoUsecase {
  constructor(readonly repo: ReordenarTiposIngressoRepository) {}

  async execute(input: ReordenarTiposIngressoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.tipos?.length) return;
    await this.repo.reordenar(input.tipos, input.companyUuid);
  }
}
