import { ApiJwt } from "src/@modules/shared/apiJwt";

export type DecoderTokenAuthenticationInput = {
  token: string;
};

export class DecoderTokenAuthenticationUsecase {
  constructor() {}

  async execute(input: DecoderTokenAuthenticationInput) {
    const payload = ApiJwt.tokenDecoding(input.token);
    return payload;
  }
}
