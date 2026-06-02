import { randomUUID } from "crypto";
import { CadastrandoUsuarioRepository } from "./cadastrandoUsuarioRepository";
import { UsuarioEntity } from "./usuario.entity";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { ApiError } from "src/@modules/shared/apiError";

export type CadastrandoUsuarioInput = {
  companyUuid: string;
  cpf: string;
  nome: string;
  email?: string;
  phone?: string;
};

export type CadastroUsuarioOutput = {
  uuid: string;
  cpf: string;
  nome: string;
  token: string;
  email: string | null;
  phone: string | null;
};

export class CadastrandoUsuarioUsecase {
  constructor(readonly repo: CadastrandoUsuarioRepository) {}

  async execute(input: CadastrandoUsuarioInput): Promise<CadastroUsuarioOutput> {
    if (!ApiValidate.validateCpf(input.cpf)) throw new ApiError("CPF inválido", 400);
    if (input.email && !ApiValidate.validateEmail(input.email)) throw new ApiError("Email inválido", 400);

    const usuario = new UsuarioEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      cpf: input.cpf,
      nome: input.nome,
      email: input.email,
      phone: input.phone,
    });

    const usuarioJaCadastrado = await this.repo.verificaCadastro(usuario);
    if (usuarioJaCadastrado) throw new ApiError("Usuário já cadastrado", 400);

    await this.repo.salvarUsuario(usuario);
    const token = await this.repo.gerarTokenAutenticacao(usuario);
    return {
      uuid: usuario.uuid(),
      cpf: usuario.cpf(),
      nome: usuario.nome(),
      token: token.token,
      email: usuario.email(),
      phone: usuario.phone(),
    };
  }
}
