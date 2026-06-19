import { ApiError } from "src/@modules/shared/apiError";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { CriarUsuarioRepository, UsuarioCriado } from "./criarUsuarioRepository";

export type CriarUsuarioInput = {
  companyUuid: string;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  password?: string;
  position?: string;
  roles?: string[];
};

export class CriarUsuarioUsecase {
  constructor(readonly repo: CriarUsuarioRepository) {}

  async execute(input: CriarUsuarioInput): Promise<UsuarioCriado> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.name?.trim()) throw new ApiError("O nome do usuário é obrigatório");
    if (!input.cpf?.trim() && !input.email?.trim()) throw new ApiError("Informe o CPF ou o e-mail do usuário");
    if (input.cpf && !ApiValidate.validateCpf(input.cpf)) throw new ApiError("CPF inválido");
    if (input.email && !ApiValidate.validateEmail(input.email)) throw new ApiError("E-mail inválido");

    const jaCadastrado = await this.repo.existeNaEmpresa(input.companyUuid, input.cpf, input.email);
    if (jaCadastrado) throw new ApiError("Já existe um usuário desta empresa com este CPF ou e-mail");

    return this.repo.criar({
      companyUuid: input.companyUuid,
      name: input.name.trim(),
      cpf: input.cpf?.trim(),
      email: input.email?.trim(),
      phone: input.phone,
      password: input.password,
      position: input.position,
      roles: input.roles,
    });
  }
}
