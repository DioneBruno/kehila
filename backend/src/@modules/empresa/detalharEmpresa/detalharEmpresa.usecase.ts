import { ApiError } from "src/@modules/shared/apiError";
import { DetalharEmpresaRepository, EmpresaDetalhe } from "./detalharEmpresaRepository";

export type DetalharEmpresaInput = {
  companyUuid: string;
};

export class DetalharEmpresaUsecase {
  constructor(readonly repo: DetalharEmpresaRepository) {}

  async execute(input: DetalharEmpresaInput): Promise<EmpresaDetalhe> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);

    const empresa = await this.repo.buscarPorUuid(input.companyUuid);
    if (!empresa) throw new ApiError("Empresa não encontrada", 404);

    return empresa;
  }
}
