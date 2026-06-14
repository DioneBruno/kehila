import dataSource from "src/@infra/database/datasource";
import { GerarTokenAuthenticationUsecase } from "../gerarTokenAuthentication.usecase";
import { GenerateTokenAuthenticationRandomCodeRepository } from "../generateTokenAuthenticationRandomCodeRepository";
import { createClient, RedisClientType } from "redis";
import { ConnectionCacheRedis } from "src/@infra/cache/cacheConnection.redis";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

let repo: GenerateTokenAuthenticationRandomCodeRepository;
const userUuid = "353ac8ac-09aa-48f1-8c38-c057698b3d12";

describe("Deve testar GerarTikenAuthenticationUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const cacheClient: RedisClientType | any = await createClient({
      url: process.env.REDIS_URL,
    }).connect();
    const cache = new ConnectionCacheRedis(cacheClient);
    const connectionHub = new ConnectionHub({ database: dataSource, cache });
    repo = new GenerateTokenAuthenticationRandomCodeRepository(connectionHub);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.destroy();
  });

  test("Deve validar codigo enviado pelo usuário e gerar token authentication", async () => {
    const companyUuid = "c708be52-396c-49f4-8942-edb513af6b10";

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone)
      VALUES ('${userUuid}', 'Nome Usuario', 'nomeUsuario', [EMAIL_ADDRESS]', '65985477589')`);

    const usecase = new GerarTokenAuthenticationUsecase(repo);
    const input = { companyUuid, username: "nomeUsuario", code: "123456" };
    const result = await usecase.execute(input);
  });
});
