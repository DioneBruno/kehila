import { GenerateTokenAuthenticationRandomCodeRepository } from "./generateTokenAuthenticationRandomCodeRepository";

export type EnviarCodigoValidadorInput = {
  companyUuid: string;
  username: string;
};

export class EnviarCodigoValidadorUsecase {
  constructor(readonly repo: GenerateTokenAuthenticationRandomCodeRepository) {}

  async execute(input: EnviarCodigoValidadorInput) {}
}
