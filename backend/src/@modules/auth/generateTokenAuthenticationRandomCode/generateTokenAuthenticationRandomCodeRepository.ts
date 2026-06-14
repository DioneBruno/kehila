import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { GenerateTokenAuthenticationUserRepository } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository";
import { GenerateTokenAuthenticationUserUsecase } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUser.usecase";

const CACHE_TTL_SECONDS = 300;

export class GenerateTokenAuthenticationRandomCodeRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarUsuarioPorUsername(companyUuid: string, username: string): Promise<{ uuid: string; email: string; phone: string } | null> {
    const [user] = await this.connectionHub.database!.query(
      `SELECT users.uuid, users.email, users.phone
       FROM auth_users users
         INNER JOIN auth_users_companies "userCompanies"
           ON users.uuid = "userCompanies".user_uuid
       WHERE (users.cpf = $2 OR users.email = $2 OR users.phone = $2)
         AND "userCompanies".company_uuid = $1`,
      [companyUuid, username],
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
}
