import { ApiError } from "src/@modules/shared/apiError";
import { texto } from "src/@modules/shared/apiTexto";
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
    const name = texto(input.name, "name")?.trim();
    const cpfCnpj = texto(input.cpfCnpj, "cpfCnpj")?.trim();
    if (name !== undefined && !name) throw new ApiError("O nome da empresa é obrigatório");
    if (cpfCnpj !== undefined && !cpfCnpj) throw new ApiError("O CPF/CNPJ é obrigatório");
    // Só valida o tipo; null continua limpando o campo.
    for (const campo of ["commercialName", "fantasyName", "stateRegistration", "email", "phone", "uf"] as const) texto(input[campo], campo);

    const existe = await this.repo.existe(input.companyUuid);
    if (!existe) throw new ApiError("Empresa não encontrada", 404);

    await this.repo.atualizar(input.companyUuid, {
      name,
      commercialName: input.commercialName,
      fantasyName: input.fantasyName,
      stateRegistration: input.stateRegistration,
      cpfCnpj,
      email: input.email,
      phone: input.phone,
      address: input.address,
      uf: input.uf,
    });
  }
}
