import { randomUUID } from "crypto";
import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirMembroUsecase } from "../../incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "../../incluirMembro/incluirMembroRepository";
import { CriarUsuarioUsecase } from "../criarUsuario.usecase";
import { CriarUsuarioRepository } from "../criarUsuarioRepository";

const companyUuid = "4b8e2d61-9a3c-4f57-8e1b-7c0d5a2f9e14";
const outraCompanyUuid = "d1f7a3c9-2e6b-4a85-b0c4-8e3f1d7a6b52";
const emails = ["membro.usuario@kehila.test", "membro.reaproveitado@kehila.test"];
let connections: ConnectionHub;

async function limpar() {
  await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid IN ($1, $2)`, [companyUuid, outraCompanyUuid]);
  await dataSource.query(`DELETE FROM auth_users WHERE email = ANY($1)`, [emails]);
  await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid IN ($1, $2)`, [companyUuid, outraCompanyUuid]);
}

describe("Deve testar CriarUsuarioUsecase (membresia)", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
    await limpar();
  });
  afterAll(async () => {
    await limpar();
    await dataSource.destroy();
  });

  const usecase = () => new CriarUsuarioUsecase(new CriarUsuarioRepository(connections));
  const incluirMembro = (input: Parameters<IncluirMembroUsecase["execute"]>[0]) =>
    new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute(input);

  test("Deve criar o usuário com os dados do membro e vincular na empresa", async () => {
    const { uuid: membroUuid } = await incluirMembro({
      companyUuid,
      nome: "  Membro Usuário  ",
      email: emails[0],
      telefone: "11999999999",
      dataNascimento: "1990-05-20",
      enderecoCidade: "São Paulo",
      enderecoUf: "SP",
    });

    const { uuid } = await usecase().execute({ companyUuid, membroUuid, password: "senha123", roles: ["MEMBRO"] });

    const [user] = await dataSource.query(`SELECT * FROM auth_users WHERE uuid = $1`, [uuid]);
    expect(user).toMatchObject({ name: "Membro Usuário", email: emails[0], phone: "11999999999", cidade: "São Paulo", uf: "SP" });
    expect(user.password).toBeTruthy();
    expect(user.password).not.toBe("senha123");

    const vinculos = await dataSource.query(`SELECT * FROM auth_users_companies WHERE user_uuid = $1`, [uuid]);
    expect(vinculos).toHaveLength(1);
    expect(vinculos[0]).toMatchObject({ company_uuid: companyUuid, is_accepted: true, roles: ["MEMBRO"] });
  });

  test("Deve lançar erro se o membro já possui usuário na empresa", async () => {
    const { uuid: membroUuid } = await incluirMembro({ companyUuid, nome: "Duplicado", email: emails[0] });
    await expect(usecase().execute({ companyUuid, membroUuid })).rejects.toThrow("Já existe um usuário desta empresa");
  });

  test("Deve reaproveitar usuário existente de outra empresa e apenas vinculá-lo", async () => {
    const { uuid: membroOutra } = await incluirMembro({ companyUuid: outraCompanyUuid, nome: "Reaproveitado", email: emails[1] });
    const { uuid: userUuid } = await usecase().execute({ companyUuid: outraCompanyUuid, membroUuid: membroOutra });

    const { uuid: membroUuid } = await incluirMembro({ companyUuid, nome: "Reaproveitado", email: emails[1] });
    const { uuid } = await usecase().execute({ companyUuid, membroUuid });

    expect(uuid).toBe(userUuid);
    const users = await dataSource.query(`SELECT uuid FROM auth_users WHERE email = $1`, [emails[1]]);
    expect(users).toHaveLength(1);
    const vinculos = await dataSource.query(`SELECT company_uuid FROM auth_users_companies WHERE user_uuid = $1 ORDER BY company_uuid`, [uuid]);
    expect(vinculos.map((v: { company_uuid: string }) => v.company_uuid).sort()).toEqual([companyUuid, outraCompanyUuid].sort());
  });

  test("Deve lançar erro se o membro não tem CPF nem e-mail", async () => {
    const { uuid: membroUuid } = await incluirMembro({ companyUuid, nome: "Sem contato" });
    await expect(usecase().execute({ companyUuid, membroUuid })).rejects.toThrow("CPF ou e-mail");
  });

  test("Deve lançar erro se o membro não existe na empresa", async () => {
    await expect(usecase().execute({ companyUuid, membroUuid: randomUUID() })).rejects.toThrow("Membro não encontrado");
  });
});
