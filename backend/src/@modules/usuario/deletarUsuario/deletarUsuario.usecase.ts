import { ApiError } from "src/@modules/shared/apiError";
import { DeletarUsuarioRepository } from "./deletarUsuarioRepository";

export type DeletarUsuarioInput = {
  companyUuid: string;
  usuarioUuid: string;
  usuarioLogadoUuid?: string;
};

export class DeletarUsuarioUsecase {
  constructor(readonly repo: DeletarUsuarioRepository) {}

  async execute(input: DeletarUsuarioInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.usuarioUuid) throw new ApiError("Usuário não identificado");
    if (input.usuarioUuid === input.usuarioLogadoUuid) throw new ApiError("Você não pode remover o seu próprio acesso");

    const existe = await this.repo.existe(input.companyUuid, input.usuarioUuid);
    if (!existe) throw new ApiError("Usuário não encontrado", 404);

    await this.repo.deletar(input.companyUuid, input.usuarioUuid);
  }
}
