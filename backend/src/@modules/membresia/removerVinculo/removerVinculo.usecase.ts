import { ApiError } from "src/@modules/shared/apiError";
import { RemoverVinculoRepository } from "./removerVinculoRepository";

export type RemoverVinculoInput = {
  companyUuid: string;
  membroUuid: string;
  vinculoUuid: string;
};

/** Remove o vínculo e também o seu inverso. */
export class RemoverVinculoUsecase {
  constructor(readonly repo: RemoverVinculoRepository) {}

  async execute(input: RemoverVinculoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.membroUuid) throw new ApiError("Membro não identificado");
    if (!input.vinculoUuid) throw new ApiError("Vínculo não identificado");

    const vinculo = await this.repo.buscar(input.companyUuid, input.vinculoUuid);
    if (!vinculo || vinculo.pessoaUuid !== input.membroUuid) throw new ApiError("Vínculo não encontrado", 404);

    await this.repo.removerPar(input.companyUuid, vinculo.pessoaUuid, vinculo.pessoaVinculadaUuid);
  }
}
