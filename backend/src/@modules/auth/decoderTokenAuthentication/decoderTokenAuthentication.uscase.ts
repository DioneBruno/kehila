import { ApiJwt } from "src/@modules/shared/apiJwt";

export type DecoderTokenAuthenticationInput = {
  token: string;
};

export type DecoderTokenAuthenticationOutput = {
  company: {
    uuid: string;
    cpfCnpj: string;
    name: string;
  };
  user: {
    uuid: string;
    email: string;
    name: string;
  };
};

export class DecoderTokenAuthenticationUsecase {
  constructor() {}

  execute(input: DecoderTokenAuthenticationInput): DecoderTokenAuthenticationOutput {
    const payload = ApiJwt.tokenDecoding(input.token);
    return {
      company: {
        uuid: payload?.company?.uuid || "",
        cpfCnpj: payload?.company?.cpfCnpj || "",
        name: payload?.company?.name || "",
      },
      user: {
        uuid: payload?.user?.uuid || "",
        email: payload?.user?.email || "",
        name: payload?.user?.name || "",
      },
    };
  }
}
