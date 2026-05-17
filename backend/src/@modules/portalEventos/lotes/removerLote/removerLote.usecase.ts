import { ApiError } from "src/@modules/shared/apiError";
import { RemoverLoteRepository } from "./removerLoteRepository";

export type RemoverLoteInput = {
  companyUuid: string;
  loteUuid: string;
};

export class RemoverLoteUsecase {
  constructor(readonly repo: RemoverLoteRepository) {}

  async execute(input: RemoverLoteInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.loteUuid) throw new ApiError("Lote não informado");

    const lote = await this.repo.buscar(input.loteUuid, input.companyUuid);
    if (!lote) throw new ApiError("Lote não encontrado", 404);

    if (lote.vendidosTotal > 0)
      throw new ApiError("Não é possível remover um lote com ingressos vendidos");

    await this.repo.remover(input.loteUuid, input.companyUuid);
  }
}
