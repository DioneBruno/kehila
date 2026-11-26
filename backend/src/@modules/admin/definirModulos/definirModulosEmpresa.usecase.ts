import { ApiError } from "src/@modules/shared/apiError";
import { ModuloChave, validarModulos } from "src/@modules/empresa/modulos/modulos";
import { DefinirModulosEmpresaRepository } from "./definirModulosEmpresaRepository";

export type DefinirModulosEmpresaInput = {
  companyUuid: string;
  companyUuidLogada: string;
  modulos: unknown;
};

export class DefinirModulosEmpresaUsecase {
  constructor(readonly repo: DefinirModulosEmpresaRepository) {}

  async execute(input: DefinirModulosEmpresaInput): Promise<ModuloChave[]> {
    const modulos = validarModulos(input.modulos);
    if (!(await this.repo.existeEmpresa(input.companyUuid))) throw new ApiError("Empresa não encontrada", 404);
    if (input.companyUuid === input.companyUuidLogada && !modulos.includes("admin")) {
      throw new ApiError("Não é possível remover o módulo Admin da própria empresa");
    }

    await this.repo.definir(input.companyUuid, modulos);
    await this.repo.limparCache(input.companyUuid);
    return modulos;
  }
}
