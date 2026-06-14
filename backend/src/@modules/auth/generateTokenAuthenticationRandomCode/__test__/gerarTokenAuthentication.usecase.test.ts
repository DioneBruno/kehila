import { randomUUID } from "crypto";
import { createClient, RedisClientType } from "redis";
import dataSource from "src/@infra/database/datasource";
import { ConnectionCacheRedis } from "src/@infra/cache/cacheConnection.redis";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ApiJwt } from "src/@modules/shared/apiJwt";
import { GenerateTokenAuthenticationRandomCodeRepository } from "../generateTokenAuthenticationRandomCodeRepository";
import { GerarTokenAuthenticationUsecase } from "../gerarTokenAuthentication.usecase";

const companyUuid = "c708be52-396c-49f4-8942-edb513af6b10";
const userUuid = "353ac8ac-09aa-48f1-8c38-c057698b3d12";
const username = "nomeUsuario";
const code = "123456";

let repo: GenerateTokenAuthenticationRandomCodeRepository;

describe("Deve testar GerarTokenAuthenticationUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const cacheClient: RedisClientType | any = await createClient({
      url: process.env.REDIS_URL,
    }).connect();
    const cache = new ConnectionCacheRedis(cacheClient);
    const connectionHub = new ConnectionHub({ database: dataSource, cache });
    repo = new GenerateTokenAuthenticationRandomCodeRepository(connectionHub);
  });

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM auth_users_companies WHERE user_uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid}'`);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users_companies WHERE user_uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve validar código enviado pelo usuário e gerar token de autenticação", async () => {
    await dataSource.query(`
      INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', 'tenant_test', 'Empresa Teste', '00.000.000/0001-00')
    `);
    await dataSource.query(`
      INSERT INTO auth_users (uuid, name, cpf, email, phone)
      VALUES ('${userUuid}', 'Nome Usuario', '${username}', 'usuario@teste.com', '65985477589')
    `);
    await dataSource.query(`
      INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position)
      VALUES ('${randomUUID()}', '${userUuid}', '${companyUuid}', true, 'member')
    `);

    await repo.salvarCodigoNoCache(companyUuid, username, code, userUuid);

    const usecase = new GerarTokenAuthenticationUsecase(repo);
    const result = await usecase.execute({ companyUuid, username, code });

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");

    const payload = ApiJwt.tokenDecoding(result.token);
    expect(payload.user.uuid).toBe(userUuid);
    expect(payload.user.cpf).toBe(username);
    expect(payload.company.uuid).toBe(companyUuid);
  });

  test("Deve lançar erro quando código não existe no cache", async () => {
    const usecase = new GerarTokenAuthenticationUsecase(repo);
    await expect(usecase.execute({ companyUuid, username: "usuarioInexistente", code })).rejects.toThrow("Código inválido ou expirado");
  });

  test("Deve lançar erro quando código enviado é inválido", async () => {
    await repo.salvarCodigoNoCache(companyUuid, username, "654321", userUuid);

    const usecase = new GerarTokenAuthenticationUsecase(repo);
    await expect(usecase.execute({ companyUuid, username, code: "000000" })).rejects.toThrow("Código inválido");
  });
});
