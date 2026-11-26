import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { TokenGenerateRepository } from "../generateTokenAutenticationUsernamePassword/tokenGenerateRepository";
import { GenerateTokenAuthenticationRandomCodeRepository } from "../generateTokenAuthenticationRandomCode/generateTokenAuthenticationRandomCodeRepository";
import { GenerateTokenAuthenticationUserRepository } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository";

// O repositório de código importa o SMS (vonage, ESM que o jest não carrega); aqui só a busca por usuário importa.
jest.mock("src/@modules/notificacao/sms/enviarSmsRepository", () => ({ EnviarSmsRepository: class {} }));

const companyUuid = "c0de0000-0000-4000-8000-0000000000a1";
const userRemovido = "c0de0000-0000-4000-8000-0000000000b1";
const userAtivo = "c0de0000-0000-4000-8000-0000000000b2";
const emailRemovido = "removido@teste.test";
const emailAtivo = "ativo@teste.test";

async function limpar() {
  await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = $1`, [companyUuid]);
  await dataSource.query(`DELETE FROM auth_users WHERE uuid = ANY($1::uuid[])`, [[userRemovido, userAtivo]]);
  await dataSource.query(`DELETE FROM auth_companies WHERE uuid = $1`, [companyUuid]);
}

describe("Login exige vínculo ativo (banco)", () => {
  let hub: ConnectionHub;

  beforeAll(async () => {
    await dataSource.initialize();
    await limpar();
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, 'test-vinculo', 'Empresa Vínculo', '00000000000000')`, [
      companyUuid,
    ]);
    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ($1, 'Removido', $2), ($3, 'Ativo', $4)`, [
      userRemovido,
      emailRemovido,
      userAtivo,
      emailAtivo,
    ]);
    await dataSource.query(
      `INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, deleted_at) VALUES ('c0de0000-0000-4000-8000-0000000000c1', $1, $3, true, now()), ('c0de0000-0000-4000-8000-0000000000c2', $2, $3, true, NULL)`,
      [userRemovido, userAtivo, companyUuid],
    );
    hub = new ConnectionHub({ database: dataSource, cache: {} as any });
  });

  afterAll(async () => {
    await limpar();
    await dataSource.destroy();
  });

  test("senha: vínculo removido não encontra usuário; ativo encontra", async () => {
    const repo = new TokenGenerateRepository(hub);
    expect(await repo.findUser(companyUuid, emailRemovido)).toBeNull();
    expect((await repo.findUser(companyUuid, emailAtivo))?.uuid()).toBe(userAtivo);
  });

  test("código por e-mail: vínculo removido não encontra usuário; ativo encontra", async () => {
    const repo = new GenerateTokenAuthenticationRandomCodeRepository(hub);
    expect(await repo.buscarUsuarioPorUsername(companyUuid, emailRemovido)).toBeNull();
    expect((await repo.buscarUsuarioPorUsername(companyUuid, emailAtivo))?.uuid).toBe(userAtivo);
  });

  test("geração de token: vínculo removido não encontra usuário; ativo encontra", async () => {
    const repo = new GenerateTokenAuthenticationUserRepository(hub);
    expect(await repo.buscarUsuario(companyUuid, userRemovido)).toBeNull();
    expect((await repo.buscarUsuario(companyUuid, userAtivo))?.uuid()).toBe(userAtivo);
  });
});
