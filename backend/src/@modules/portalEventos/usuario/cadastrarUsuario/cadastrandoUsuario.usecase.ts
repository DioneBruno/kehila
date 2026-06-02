import { randomUUID } from "crypto";
import { CadastrandoUsuarioRepository } from "./cadastrandoUsuarioRepository";
import { UsuarioEntity } from "./usuario.entity";
import { ApiValidate } from "src/@modules/shared/apiValidate";

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
};

export class CadastrandoUsuarioUsecase {
  constructor(readonly repo: CadastrandoUsuarioRepository) {}

  async execute(input: CadastrandoUsuarioInput): Promise<CadastroUsuarioOutput> {
    if (!ApiValidate.validateCpf(input.cpf)) throw new Error("CPF inválido");

    const usuario = new UsuarioEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      cpf: input.cpf,
      nome: input.nome,
      email: input.email,
      phone: input.phone,
    });

    const usuarioJaCadastrado = await this.repo.verificaCadastro(usuario);
    if (usuarioJaCadastrado) throw new Error("Usuário já cadastrado");

    await this.repo.salvarUsuario(usuario);
    return {
      uuid: usuario.uuid(),
      cpf: usuario.cpf(),
      nome: usuario.nome(),
    };
  }
}
