import { ApiError } from "src/@modules/shared/apiError";
import { ModuloChave } from "src/@modules/empresa/modulos/modulos";
import { DefinirModulosEmpresaRepository } from "./definirModulosEmpresaRepository";

export type DefinirModulosEmpresaInput = {
  companyUuid: string;
  companyUuidLogada: string;
  modulos: ModuloChave[];
};

export class DefinirModulosEmpresaUsecase {
  constructor(readonly repo: DefinirModulosEmpresaRepository) {}

  async execute(input: DefinirModulosEmpresaInput): Promise<ModuloChave[]> {
    if (!(await this.repo.existeEmpresa(input.companyUuid))) throw new ApiError("Empresa não encontrada", 404);
    if (input.companyUuid === input.companyUuidLogada && !input.modulos.includes("admin")) {
      throw new ApiError("Não é possível remover o módulo Admin da própria empresa");
    }

    await this.repo.definir(input.companyUuid, input.modulos);
    await this.repo.limparCache(input.companyUuid);
    return input.modulos;
  }
}
