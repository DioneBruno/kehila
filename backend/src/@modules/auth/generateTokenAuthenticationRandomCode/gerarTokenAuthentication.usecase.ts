import { ApiError } from "src/@modules/shared/apiError";
import { GenerateTokenAuthenticationRandomCodeRepository } from "./generateTokenAuthenticationRandomCodeRepository";

export type GerarTokenAuthenticationInput = {
  companyUuid: string;
  username: string;
  code: string;
};

export type GerarTokenAuthenticationOutput = {
  token: string;
};

export class GerarTokenAuthenticationUsecase {
  constructor(readonly repo: GenerateTokenAuthenticationRandomCodeRepository) {}

  async execute(input: GerarTokenAuthenticationInput): Promise<GerarTokenAuthenticationOutput> {
    if (!input.companyUuid || !input.username || !input.code) throw new ApiError("Código inválido ou expirado", 400);
    const cached = await this.repo.buscarCodigoNoCache(input.companyUuid, input.username);
    if (!cached) throw new ApiError("Código inválido ou expirado", 400);
    if (cached.code !== String(input.code)) {
      // Limita tentativas: após várias erradas o código é descartado e um novo precisa ser pedido.
      await this.repo.registrarTentativaInvalida(input.companyUuid, input.username, cached);
      throw new ApiError("Código inválido", 400);
    }

    // Código de uso único.
    await this.repo.removerCodigoDoCache(input.companyUuid, input.username);
    const response = await this.repo.gerarTokenAuthentication(input.companyUuid, cached.userUuid);
    return response;
  }
}
