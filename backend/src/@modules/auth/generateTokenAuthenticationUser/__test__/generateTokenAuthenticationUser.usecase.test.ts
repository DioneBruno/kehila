import * as bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";
import dataSource from "src/@infra/database/datasource";
import { ApiJwt } from "src/@modules/shared/apiJwt";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { GenerateTokenAuthenticationUserRepository } from "../generateTokenAuthenticationUserRepository";
import { GenerateTokenAuthenticationUserUsecase } from "../generateTokenAuthenticationUser.usecase";

const companyUuid = "3ec4dd3b-e3ea-4f44-9a19-04213f64f3b5";
const userUuid = "c9234439-2557-42cd-bcdd-013267df8c50";
const username = "013267df8c50";

let repo: GenerateTokenAuthenticationUserRepository;
let passwordCrypto: string;

describe("Deve testar TokenGenerateUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub(dataSource);
    repo = new GenerateTokenAuthenticationUserRepository(connectionHub);

    passwordCrypto = await bcryptjs.hash("123456", 10);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}';`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE uuid = '${userUuid}';`);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid}';`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = '${companyUuid}';`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}';`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE uuid = '${userUuid}';`);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid}';`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = '${companyUuid}';`);
    await dataSource.destroy();
  });

  test("Deve gerar token de acesso para usuário informando companyUuid e userUuid", async () => {
    await dataSource.query(`INSERT INTO auth_users (uuid, cpf, name, email, password, email_confirmed_at)
      VALUES ('${userUuid}', 'userCpf', 'nome', '${username}', '${passwordCrypto}', '2024-06-06');
    `);

    await dataSource.query(`INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position)
      VALUES ('${randomUUID()}', '${userUuid}', '${companyUuid}', true, 'admin');
    `);
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', 'admin', 'companyName', 'cnpj');
    `);

    const usecase = new GenerateTokenAuthenticationUserUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
    };
    const response = await usecase.execute(input);

    const payload = ApiJwt.tokenDecoding(response.token);

    expect(payload.user.uuid).toBe(userUuid);
    expect(payload.user.cpfCnpj).toBe("userCpf");
    expect(payload.user.name).toBe("nome");
    expect(payload.user.email).toBe(username);

    expect(payload.company.uuid).toBe(companyUuid);
    expect(payload.company.name).toBe("companyName");
    expect(payload.company.cpfCnpj).toBe("cnpj");
  });

  test("Deve validar usuario não encontrado", async () => {
    await dataSource.query(`INSERT INTO auth_users (uuid, cpf, name, email, password, email_confirmed_at)
      VALUES ('${userUuid}', 'userCpf', '${username}', 'userEmail', '${passwordCrypto}', '2024-06-06');
    `);

    await dataSource.query(`INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position)
      VALUES ('${randomUUID()}', '${userUuid}', '${companyUuid}', true, 'admin');
    `);
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', 'admin', 'companyName', 'cnpj');
    `);

    const usecase = new GenerateTokenAuthenticationUserUsecase(repo);
    const input = {
      companyUuid,
      userUuid: "0c3256f8-ae33-4dd4-9fc7-699567761f20",
    };
    await expect(usecase.execute(input)).rejects.toThrow("Usuário não encontrado");
  });
});
