import { ApiError } from "src/@modules/shared/apiError";
import { GenerateTokenAuthenticationUserRepository } from "./generateTokenAuthenticationUserRepository";

export type GenerateTokenAuthenticationUserInput = {
  companyUuid: string;
  userUuid: string;
};

export type GenerateTokenAuthenticationUserOutput = {
  token: string;
};

export class GenerateTokenAuthenticationUserUsecase {
  constructor(readonly repo: GenerateTokenAuthenticationUserRepository) {}

  async execute(input: GenerateTokenAuthenticationUserInput): Promise<GenerateTokenAuthenticationUserOutput> {
    const user = await this.repo.buscarUsuario(input.companyUuid, input.userUuid);
    if (!user) throw new ApiError("Usuário não encontrado", 400);
    return {
      token: user.tokenGenegate(),
    };
  }
}
