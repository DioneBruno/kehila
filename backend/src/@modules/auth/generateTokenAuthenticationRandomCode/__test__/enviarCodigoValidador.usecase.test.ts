import * as sinon from "sinon";
import dataSource from "src/@infra/database/datasource";
import { EnviarCodigoValidadorUsecase } from "../enviarCodigoValidador.usecase";
import { GenerateTokenAuthenticationRandomCodeRepository } from "../generateTokenAuthenticationRandomCodeRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { ConnectionCacheRedis } from "src/@infra/cache/cacheConnection.redis";

const companyUuid = "d22ca823-c559-4d91-9a59-7c7a499d6977";
const userUuid = "7a426c07-7709-4adc-b3f7-4782c9a12b89";
const username = "A12345678909B";
const userEmail = "emaildousuario@endereco.com";
const userPhone = "65985477589";

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

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    sinon.restore();
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.destroy();
  });

  async function inserirUsuario() {
    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone)
      VALUES ('${userUuid}', 'Nome Usuario', '${username}', '${userEmail}', '${userPhone}')`);
    await dataSource.query(`INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position)
      VALUES ('${userUuid}', '${userUuid}', '${companyUuid}', true, 'member')
      ON CONFLICT DO NOTHING`);
  }

  test("Deve gerar um código de 6 dígitos e salvá-lo no cache", async () => {
    await inserirUsuario();
    sinon.stub(repo, "enviarEmail").resolves();
    sinon.stub(repo, "enviarSms").resolves();

    const usecase = new EnviarCodigoValidadorUsecase(repo);
    const result = await usecase.execute({ companyUuid, username });

    expect(result.code).toBeDefined();
    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.email).toBe("e*****o@endereco.com");
    expect(result.phone).toBe("65985#####9");

    const cached = await repo.buscarCodigoNoCache(companyUuid, username);
    expect(cached).not.toBeNull();
    expect(cached!.code).toBe(result.code);
    expect(cached!.userUuid).toBe(userUuid);
  });

  test("Deve enviar o código via email com destinatário e código corretos", async () => {
    await inserirUsuario();
    const enviarEmailStub = sinon.stub(repo, "enviarEmail").resolves();
    sinon.stub(repo, "enviarSms").resolves();

    const usecase = new EnviarCodigoValidadorUsecase(repo);
    const result = await usecase.execute({ companyUuid, username });

    expect(enviarEmailStub.calledOnce).toBe(true);
    expect(enviarEmailStub.firstCall.args[0]).toBe(userEmail);
    expect(enviarEmailStub.firstCall.args[1]).toBe(result.code);
  });

  test("Deve enviar o código via SMS com destinatário e código corretos", async () => {
    await inserirUsuario();
    sinon.stub(repo, "enviarEmail").resolves();
    const enviarSmsStub = sinon.stub(repo, "enviarSms").resolves();

    const usecase = new EnviarCodigoValidadorUsecase(repo);
    const result = await usecase.execute({ companyUuid, username });

    expect(enviarSmsStub.calledOnce).toBe(true);
    expect(enviarSmsStub.firstCall.args[0]).toBe(userPhone);
    expect(enviarSmsStub.firstCall.args[1]).toBe(result.code);
  });

  test("Deve lançar erro quando usuário não é encontrado", async () => {
    sinon.stub(repo, "enviarEmail").resolves();
    sinon.stub(repo, "enviarSms").resolves();

    const usecase = new EnviarCodigoValidadorUsecase(repo);
    await expect(usecase.execute({ companyUuid, username: "cpf_inexistente" })).rejects.toThrow("Usuário não encontrado");
  });
});
