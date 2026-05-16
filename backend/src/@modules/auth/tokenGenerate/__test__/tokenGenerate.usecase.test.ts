import * as bcryptjs from "bcryptjs";
import dataSource from "src/@infra/database/datasource";
import { TokenGenerateRepository } from "../tokenGenerateRepository";
import { randomUUID } from "crypto";
import { TokenGenerateUseCase } from "../tokenGenerate.usecase";
import { ApiJwt } from "src/@modules/shared/apiJwt";
import { ConnectionHub } from "src/@modules/shared/connectionHub";

const companyUuid = "3ec4dd3b-e3ea-4f44-9a19-04213f64f3b5";
const userUuid = "c9234439-2557-42cd-bcdd-013267df8c50";
const userName = "";

let repo: TokenGenerateRepository;
let passwordCrypto: string;

describe("Deve testar TokenGenerateUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub(dataSource);
    repo = new TokenGenerateRepository(connectionHub);

    passwordCrypto = await bcryptjs.hash("123456", 10);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}';`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE uuid = '${userUuid}';`);
    await dataSource.destroy();
  });

  test("Deve gerar token de acesso para usuário informando email e senha", async () => {
    await dataSource.query(`INSERT INTO auth_users (uuid, cpf, name, email, password, email_confirmed_at)
      VALUES ('${userUuid}', 'userCpf', '${userName}', 'userEmail', '${passwordCrypto}', '2024-06-06');
    `);

    await dataSource.query(`INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position)
      VALUES ('${randomUUID()}', '${userUuid}', '${companyUuid}', true, 'admin');
    `);

    const usecase = new TokenGenerateUseCase(repo);
    const input = {
      companyUuid,
      userName,
      password: "123456",
    };
    const response = await usecase.execute(input);

    const payload = ApiJwt.tokenDecoding(response.token);

    expect(payload.user.uuid).toBe(userUuid);
    expect(payload.user.cpfCnpj).toBe("userCpf");
    expect(payload.user.name).toBe(userName);
    expect(payload.user.email).toBe("userEmail");

    expect(1 == 1).toBe(true);
  });
});
