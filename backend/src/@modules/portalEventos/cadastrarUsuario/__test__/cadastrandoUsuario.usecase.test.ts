import dataSource from "src/@infra/database/datasource";
import { CadastrandoUsuarioUsecase } from "../cadastrandoUsuario.usecase";
import { CadastrandoUsuarioRepository } from "../cadastrandoUsuarioRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { randomUUID } from "crypto";

const companyUuid = "93c54133-a399-43a3-99f1-fa8a8a603bdd";
const cpf = "68869955451";
let repo: CadastrandoUsuarioRepository;

describe("Deve testar CadastrandoUsuarioUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub({ database: dataSource });
    repo = new CadastrandoUsuarioRepository(connectionHub);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE cpf = '${cpf}'`);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE cpf = '${cpf}'`);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve cadastrar novo usuario", async () => {
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', '${companyUuid}', 'Empresa teste', '12345678901234')`);

    const usecase = new CadastrandoUsuarioUsecase(repo);
    const input = {
      companyUuid,
      cpf,
      name: "Usuário teste",
      email: "email@gmail.com",
      phone: "99999999999",
    };
    await usecase.execute(input);

    const [usuarioModel] = await dataSource.query(`SELECT * FROM auth_users WHERE cpf = '${cpf}'`);
    expect(usuarioModel.cpf).toBe(cpf);
    expect(usuarioModel.name).toBe(input.name);
    expect(usuarioModel.email).toBe(input.email);
    expect(usuarioModel.phone).toBe(input.phone);
  });

  test("Deve vincular novo usuario na empresa", async () => {
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', '${companyUuid}', 'Empresa teste', '12345678901234')`);

    const usecase = new CadastrandoUsuarioUsecase(repo);
    const input = {
      companyUuid,
      cpf,
      name: "Usuário teste",
    };
    const usuario = await usecase.execute(input);

    const [usuarioModel] = await dataSource.query(`SELECT * FROM auth_users_companies WHERE company_uuid = '${companyUuid}'`);
    expect(usuarioModel.user_uuid).toBe(usuario.uuid);
    expect(usuarioModel.roles).toEqual(["usuario-externo"]);
  });

  test("Deve retornar token authentication para o novo usuario", async () => {
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', '${companyUuid}', 'Empresa teste', '12345678901234')`);

    const usecase = new CadastrandoUsuarioUsecase(repo);
    const input = {
      companyUuid,
      cpf,
      name: "Usuário teste",
    };
    const usuario = await usecase.execute(input);

    expect(usuario.token).not.toBe(null);
    expect(usuario.token).not.toBe(undefined);
  });

  test("Deve informar que cpf já tem cadastro na company", async () => {
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', '${companyUuid}', 'Empresa teste', '12345678901234')`);

    const userUuid = "f889b192-684c-414f-8f02-77f9a411c30b";
    await dataSource.query(`INSERT INTO auth_users (uuid, cpf, name)
      VALUES ('${userUuid}', '${cpf}', 'Usuário teste')`);
    await dataSource.query(`INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted)
      VALUES ('${randomUUID()}', '${userUuid}', '${companyUuid}', true)`);

    const usecase = new CadastrandoUsuarioUsecase(repo);
    const input = {
      companyUuid,
      cpf,
      name: "Usuário teste",
    };
    await expect(usecase.execute(input)).rejects.toThrow("Usuário já cadastrado");
  });

  test("Deve cadastrar se usuário estiver registro em outra company", async () => {
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid}', '${companyUuid}', 'Empresa teste', '12345678901234')`);

    const companyUuid2 = "a79c9f66-c986-4ffc-9047-2d3623d09977";
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid = '${companyUuid2}'`);
    await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = '${companyUuid2}'`);

    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj)
      VALUES ('${companyUuid2}', '${companyUuid}', 'Empresa teste', '12345678901234')`);

    const userUuid = "f889b192-684c-414f-8f02-77f9a411c30b";
    await dataSource.query(`INSERT INTO auth_users (uuid, cpf, name)
      VALUES ('${userUuid}', '${cpf}', 'Usuário teste')`);
    await dataSource.query(`INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted)
      VALUES ('${randomUUID()}', '${userUuid}', '${companyUuid2}', true)`);

    const usecase = new CadastrandoUsuarioUsecase(repo);
    const input = {
      companyUuid,
      cpf,
      name: "Usuário teste",
    };
    await usecase.execute(input);
  });
});
