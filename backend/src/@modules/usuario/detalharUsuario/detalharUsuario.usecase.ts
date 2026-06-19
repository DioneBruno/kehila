import { ApiError } from "src/@modules/shared/apiError";
import { DetalharUsuarioRepository, UsuarioDetalhe } from "./detalharUsuarioRepository";

export type DetalharUsuarioInput = {
  companyUuid: string;
  usuarioUuid: string;
};

export class DetalharUsuarioUsecase {
  constructor(readonly repo: DetalharUsuarioRepository) {}

  async execute(input: DetalharUsuarioInput): Promise<UsuarioDetalhe> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.usuarioUuid) throw new ApiError("Usuário não identificado");

    const usuario = await this.repo.buscarPorUuid(input.companyUuid, input.usuarioUuid);
    if (!usuario) throw new ApiError("Usuário não encontrado", 404);

    return usuario;
  }
}
