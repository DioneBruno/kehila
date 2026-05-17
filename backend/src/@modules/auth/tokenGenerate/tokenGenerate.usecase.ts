import { ApiError } from "src/@modules/shared/apiError";
import { TokenGenerateRepository } from "./tokenGenerateRepository";

export type TokenGenerateInput = {
  companyUuid: string;
  username: string;
  password: string;
};

export class TokenGenerateUseCase {
  constructor(readonly repo: TokenGenerateRepository) {}

  async execute(input: TokenGenerateInput): Promise<{ token: string }> {
    if (!input.companyUuid) throw new ApiError("Informe a empresa", 401);
    if (!input.username) throw new ApiError("Informe o usuário", 401);
    if (!input.password) throw new ApiError("Informe a senha", 401);

    const user = await this.repo.findUser(input.companyUuid, input.username);
    if (!user) throw new ApiError("Credenciais inválidas", 401);
    await user.checkPassword(input.password);
    const token = user.tokenGenegate();
    return { token };
  }
}
