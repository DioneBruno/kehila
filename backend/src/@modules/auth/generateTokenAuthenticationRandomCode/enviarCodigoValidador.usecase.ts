import { ApiError } from "src/@modules/shared/apiError";
import { GenerateTokenAuthenticationRandomCodeRepository } from "./generateTokenAuthenticationRandomCodeRepository";

export type EnviarCodigoValidadorInput = {
  companyUuid: string;
  username: string;
};

export type EnviarCodigoValidadorOutput = {
  code: string;
};

export type CodigoValidadorNotificacoes = {
  enviarEmail: (destinatario: string, code: string) => Promise<void>;
  enviarSms: (destinatario: string, code: string) => Promise<void>;
};

export class EnviarCodigoValidadorUsecase {
  constructor(
    readonly repo: GenerateTokenAuthenticationRandomCodeRepository,
    readonly notificacoes: CodigoValidadorNotificacoes,
  ) {}

  async execute(input: EnviarCodigoValidadorInput): Promise<EnviarCodigoValidadorOutput> {
    const user = await this.repo.buscarUsuarioPorUsername(input.companyUuid, input.username);
    if (!user) throw new ApiError("Usuário não encontrado", 400);

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await this.repo.salvarCodigoNoCache(input.companyUuid, input.username, code, user.uuid);
    await this.notificacoes.enviarEmail(user.email, code);
    await this.notificacoes.enviarSms(user.phone, code);

    return { code };
  }
}
