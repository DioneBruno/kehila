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
    return {
      token: "",
    };
  }
}
