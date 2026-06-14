import dataSource from "src/@infra/database/datasource";
import { EnviarCodigoValidadorUsecase } from "../enviarCodigoValidador.usecase";
import { GenerateTokenAuthenticationRandomCodeRepository } from "../generateTokenAuthenticationRandomCodeRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { ConnectionCacheRedis } from "src/@infra/cache/cacheConnection.redis";

const userUuid = "7a426c07-7709-4adc-b3f7-4782c9a12b89";
let repo: GenerateTokenAuthenticationRandomCodeRepository;

describe("Deve testar EnviarCodigoValidadorUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const cacheClient: RedisClientType | any = await createClient({
      url: process.env.REDIS_URL,
    }).connect();
    const cache = new ConnectionCacheRedis(cacheClient);
    const connectionHub = new ConnectionHub({ database: dataSource, cache });
    repo = new GenerateTokenAuthenticationRandomCodeRepository(connectionHub);
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.destroy();
  });

  test("Deve enviar codigo validado", async () => {
    const companyUuid = "d22ca823-c559-4d91-9a59-7c7a499d6977";

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone)
      VALUES ('${userUuid}', 'Nome Usuario', 'A12345678909B', 'emaildousuario@endereco.com', '65985477589')`);

    const usecase = new EnviarCodigoValidadorUsecase(repo);
    const input = {
      companyUuid,
      username: "A12345678909B",
    };
    await usecase.execute(input);
  });
});
