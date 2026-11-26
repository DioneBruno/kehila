import { ApiError } from "src/@modules/shared/apiError";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { listaTexto, texto } from "src/@modules/shared/apiTexto";
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
    const name = texto(input.name, "name");
    const cpf = texto(input.cpf, "cpf");
    const email = texto(input.email, "email");
    const phone = texto(input.phone, "phone");
    const password = texto(input.password, "password");
    const position = texto(input.position, "position");
    const roles = listaTexto(input.roles, "roles");
    if (!name?.trim()) throw new ApiError("O nome do usuário é obrigatório");
    if (!cpf?.trim() && !email?.trim()) throw new ApiError("Informe o CPF ou o e-mail do usuário");
    if (cpf && !ApiValidate.validateCpf(cpf)) throw new ApiError("CPF inválido");
    if (email && !ApiValidate.validateEmail(email)) throw new ApiError("E-mail inválido");

    const jaCadastrado = await this.repo.existeNaEmpresa(input.companyUuid, cpf, email);
    if (jaCadastrado) throw new ApiError("Já existe um usuário desta empresa com este CPF ou e-mail");

    return this.repo.criar({
      companyUuid: input.companyUuid,
      name: name.trim(),
      cpf: cpf?.trim(),
      email: email?.trim(),
      phone,
      password,
      position,
      roles,
    });
  }
}
