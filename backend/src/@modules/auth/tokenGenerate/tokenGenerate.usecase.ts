import { ApiError } from "src/@modules/shared/apiError";
import { TokenGenerateRepository } from "./tokenGenerateRepository";

export type TokenGenerateInput = {
  companyUuid: string;
  userName: string;
  password: string;
};

export class TokenGenerateUseCase {
  constructor(readonly repo: TokenGenerateRepository) {}

  async execute(input: TokenGenerateInput): Promise<{ token: string }> {
    const user = await this.repo.findUser(input.companyUuid, input.userName);
    if (!user) throw new ApiError("Credenciais inválidas", 401);
    await user.checkPassword(input.password);
    const token = user.tokenGenegate();
    return { token };
  }
}
