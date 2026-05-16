import { TokenGenerateRepository } from "./tokenGenerateRepository";

export type TokenGenerateInput = {
  companyUuid: string;
  userName: string;
  password: string;
};

export class TokenGenerateUseCase {
  constructor(readonly repo: TokenGenerateRepository) {}

  async execute(input: TokenGenerateInput) {}
}
