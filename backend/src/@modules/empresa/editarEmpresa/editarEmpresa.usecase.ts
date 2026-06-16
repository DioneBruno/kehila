import { ApiError } from "src/@modules/shared/apiError";
import { EditarEmpresaRepository } from "./editarEmpresaRepository";

export type EditarEmpresaInput = {
  companyUuid: string;
  name?: string;
  commercialName?: string;
  fantasyName?: string;
  stateRegistration?: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
  uf?: string;
};

export class EditarEmpresaUsecase {
  constructor(readonly repo: EditarEmpresaRepository) {}

  async execute(input: EditarEmpresaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (input.name !== undefined && !input.name.trim()) throw new ApiError("O nome da empresa é obrigatório");
    if (input.cpfCnpj !== undefined && !input.cpfCnpj.trim()) throw new ApiError("O CPF/CNPJ é obrigatório");

    const existe = await this.repo.existe(input.companyUuid);
    if (!existe) throw new ApiError("Empresa não encontrada", 404);

    await this.repo.atualizar(input.companyUuid, {
      name: input.name?.trim(),
      commercialName: input.commercialName,
      fantasyName: input.fantasyName,
      stateRegistration: input.stateRegistration,
      cpfCnpj: input.cpfCnpj?.trim(),
      email: input.email,
      phone: input.phone,
      address: input.address,
      uf: input.uf,
    });
  }
}
