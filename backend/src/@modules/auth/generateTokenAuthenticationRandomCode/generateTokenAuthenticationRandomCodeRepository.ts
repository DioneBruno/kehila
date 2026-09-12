import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { GenerateTokenAuthenticationUserRepository } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository";
import { GenerateTokenAuthenticationUserUsecase } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUser.usecase";
import { EnviarEmailRepository } from "src/@modules/notificacao/email/enviarEmailRepository";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { EnviarSmsRepository } from "src/@modules/notificacao/sms/enviarSmsRepository";
import { EnviarSmsUsecase } from "src/@modules/notificacao/sms/enviarSms.usecase";

const CACHE_TTL_SECONDS = 60 * 24; // 1 dia

export class GenerateTokenAuthenticationRandomCodeRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarUsuarioPorUsername(companyUuid: string, username: string): Promise<{ uuid: string; email: string; phone: string } | null> {
    const [user] = await this.connectionHub.database!.query(
      `SELECT users.uuid, users.email, users.phone
       FROM auth_users users
       INNER JOIN auth_users_companies "userCompanies"
         ON users.uuid = "userCompanies".user_uuid
       WHERE (users.cpf = $1 OR users.email = $1 OR users.phone = $1)`,
      [username],
    );
    if (!user) return null;
    return { uuid: user.uuid, email: user.email, phone: user.phone };
  }

  async salvarCodigoNoCache(companyUuid: string, username: string, code: string, userUuid: string): Promise<void> {
    const key = `auth_random_code:${companyUuid}:${username}`;
    await this.connectionHub.cache!.saveObject(key, { code, userUuid }, CACHE_TTL_SECONDS);
  }

  async buscarCodigoNoCache(companyUuid: string, username: string): Promise<{ code: string; userUuid: string } | null> {
    const key = `auth_random_code:${companyUuid}:${username}`;
    const result = await this.connectionHub.cache!.findKey(key);
    return result as { code: string; userUuid: string } | null;
  }

  async gerarTokenAuthentication(companyUuid: string, userUuid: string) {
    const repo = new GenerateTokenAuthenticationUserRepository(this.connectionHub);
    const generateTokenUsecase = new GenerateTokenAuthenticationUserUsecase(repo);
    return generateTokenUsecase.execute({ companyUuid, userUuid });
  }

  async enviarEmail(companyUuid: string, email: string, code: string): Promise<void> {
    try {
      const repo = new EnviarEmailRepository(this.connectionHub);
      const usecase = new EnviarEmailUsecase(repo);
      const template = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; text-align: center;">
            <h1 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Código para acesso</h1>
            <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 24px;">
              Use o código abaixo para acessar o sistema
            </p>
            <div style="display: inline-block; background-color: #f0f0f0; border-radius: 6px; padding: 16px 32px; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
            </div>
            <p style="color: #8a8a8a; font-size: 12px; margin: 0;">
              Se você não solicitou este código, ignore este e-mail.
            </p>
          </div>
        </div>
      `;
      await usecase.execute({
        companyUuid,
        gateway: "smtp",
        destinatario: email,
        titulo: "Código para acesso",
        mensagem: template,
      });
    } catch (error) {
      console.error("Erro ao enviar email: ", error);
    }
  }

  async enviarSms(phone: string, code: string): Promise<void> {
    try {
      const repo = new EnviarSmsRepository(this.connectionHub);
      const usecase = new EnviarSmsUsecase(repo);
      await usecase.execute({ gateway: "vonage", destinatario: phone, mensagem: `Código de verificação: ${code}` });
    } catch (error) {
      console.error("Erro ao enviar sms: ", error);
    }
  }
}
