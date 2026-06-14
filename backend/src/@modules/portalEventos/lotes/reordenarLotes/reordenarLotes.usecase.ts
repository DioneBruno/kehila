import { ApiError } from "src/@modules/shared/apiError";
import { ReordenarLotesRepository } from "./reordenarLotesRepository";

export type ReordenarLotesInput = {
  companyUuid: string;
  lotes: { uuid: string; ordem: number }[];
};

export class ReordenarLotesUsecase {
  constructor(readonly repo: ReordenarLotesRepository) {}

  async execute(input: ReordenarLotesInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.lotes?.length) return;
    await this.repo.reordenar(input.lotes, input.companyUuid);
  }
}
