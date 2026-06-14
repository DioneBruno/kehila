import { ApiError } from "src/@modules/shared/apiError";
import { GenerateTokenAuthenticationUserRepository } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository";
import { GenerateTokenAuthenticationUserUsecase } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUser.usecase";
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
  constructor(
    readonly repo: GenerateTokenAuthenticationRandomCodeRepository,
    readonly generateTokenRepo: GenerateTokenAuthenticationUserRepository,
  ) {}

  async execute(input: GerarTokenAuthenticationInput): Promise<GerarTokenAuthenticationOutput> {
    const cached = await this.repo.buscarCodigoNoCache(input.companyUuid, input.username);
    if (!cached) throw new ApiError("Código inválido ou expirado", 400);
    if (cached.code !== input.code) throw new ApiError("Código inválido", 400);

    const generateTokenUsecase = new GenerateTokenAuthenticationUserUsecase(this.generateTokenRepo);
    return generateTokenUsecase.execute({ companyUuid: input.companyUuid, userUuid: cached.userUuid });
  }
}
