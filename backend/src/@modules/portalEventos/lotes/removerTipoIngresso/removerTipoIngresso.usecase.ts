import { ApiError } from "src/@modules/shared/apiError";
import { RemoverTipoIngressoRepository } from "./removerTipoIngressoRepository";

export type RemoverTipoIngressoInput = {
  companyUuid: string;
  tipoUuid: string;
};

export class RemoverTipoIngressoUsecase {
  constructor(readonly repo: RemoverTipoIngressoRepository) {}

  async execute(input: RemoverTipoIngressoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.tipoUuid) throw new ApiError("Tipo de ingresso não informado");

    const tipo = await this.repo.buscar(input.tipoUuid, input.companyUuid);
    if (!tipo) throw new ApiError("Tipo de ingresso não encontrado", 404);

    if (tipo.vendidos > 0)
      throw new ApiError("Não é possível remover um tipo de ingresso com ingressos já vendidos");

    await this.repo.remover(input.tipoUuid, input.companyUuid);
  }
}
