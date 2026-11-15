import { ApiError } from "src/@modules/shared/apiError";
import { CriarUsuarioRepository } from "./criarUsuarioRepository";

export type CriarUsuarioInput = {
  companyUuid: string;
  membroUuid: string;
  password?: string;
  position?: string;
  roles?: string[];
};

export type CriarUsuarioOutput = {
  uuid: string;
};

/**
 * Cria um usuário (auth_users) a partir dos dados de um Membro (auth_pessoas)
 * e o vincula à empresa do membro (auth_users_companies).
 * Se já existir um usuário com o mesmo CPF/e-mail em outra empresa, ele é reaproveitado e apenas vinculado.
 */
export class CriarUsuarioUsecase {
  constructor(readonly repo: CriarUsuarioRepository) {}

  async execute(input: CriarUsuarioInput): Promise<CriarUsuarioOutput> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.membroUuid) throw new ApiError("Membro não identificado");

    const membro = await this.repo.buscarMembro(input.companyUuid, input.membroUuid);
    if (!membro) throw new ApiError("Membro não encontrado", 404);
    if (!membro.nome?.trim()) throw new ApiError("O membro precisa ter um nome para gerar o usuário");

    const cpf = membro.cpf?.trim() || null;
    const email = membro.email?.trim() || null;
    if (!cpf && !email) throw new ApiError("O membro precisa ter CPF ou e-mail para gerar o usuário");

    const existente = await this.repo.buscarUsuarioExistente(input.companyUuid, cpf, email);
    if (existente?.vinculadoNaEmpresa) throw new ApiError("Já existe um usuário desta empresa com este CPF ou e-mail");

    return this.repo.criar({
      membro: { ...membro, nome: membro.nome.trim(), cpf, email },
      usuarioExistenteUuid: existente?.uuid,
      password: input.password,
      position: input.position,
      roles: input.roles ?? [],
    });
  }
}
