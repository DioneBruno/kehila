import { ApiError } from "src/@modules/shared/apiError";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { EditarUsuarioRepository } from "./editarUsuarioRepository";

export type EditarUsuarioInput = {
  companyUuid: string;
  usuarioUuid: string;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  password?: string;
  position?: string;
  roles?: string[];
  isAccepted?: boolean;
};

export class EditarUsuarioUsecase {
  constructor(readonly repo: EditarUsuarioRepository) {}

  async execute(input: EditarUsuarioInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.usuarioUuid) throw new ApiError("Usuário não identificado");
    if (input.name !== undefined && !input.name.trim()) throw new ApiError("O nome do usuário é obrigatório");
    if (input.cpf && !ApiValidate.validateCpf(input.cpf)) throw new ApiError("CPF inválido");
    if (input.email && !ApiValidate.validateEmail(input.email)) throw new ApiError("E-mail inválido");

    const existe = await this.repo.existe(input.companyUuid, input.usuarioUuid);
    if (!existe) throw new ApiError("Usuário não encontrado", 404);

    await this.repo.atualizar(input.companyUuid, input.usuarioUuid, {
      name: input.name?.trim(),
      cpf: input.cpf?.trim(),
      email: input.email?.trim(),
      phone: input.phone,
      password: input.password,
      position: input.position,
      roles: input.roles,
      isAccepted: input.isAccepted,
    });
  }
}
