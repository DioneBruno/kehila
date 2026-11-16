import { randomInt } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { GenerateTokenAuthenticationRandomCodeRepository } from "./generateTokenAuthenticationRandomCodeRepository";

export type EnviarCodigoValidadorInput = {
  companyUuid: string;
  username: string;
};

// O código NUNCA deve ser devolvido na resposta: ele só pode chegar ao usuário pelo e-mail.
export type EnviarCodigoValidadorOutput = {
  email: string;
  phone: string;
};

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  return `${local[0]}*****${local[local.length - 1]}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  return `${phone.slice(0, 5)}#####${phone[phone.length - 1]}`;
}

export class EnviarCodigoValidadorUsecase {
  constructor(readonly repo: GenerateTokenAuthenticationRandomCodeRepository) {}

  async execute(input: EnviarCodigoValidadorInput): Promise<EnviarCodigoValidadorOutput> {
    if (!input.companyUuid) throw new ApiError("Informe a empresa", 400);
    if (!input.username) throw new ApiError("Informe o usuário", 400);
    const user = await this.repo.buscarUsuarioPorUsername(input.companyUuid, input.username);
    if (!user) throw new ApiError("Usuário não encontrado", 400);

    const code = String(randomInt(100000, 1000000));

    await this.repo.salvarCodigoNoCache(input.companyUuid, input.username, code, user.uuid);
    await this.repo.enviarEmail(input.companyUuid, user.email, code);
    // await this.repo.enviarSms(user.phone, code);

    return { email: maskEmail(user.email), phone: maskPhone(user.phone) };
  }
}
