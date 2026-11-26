import { randomUUID } from "crypto";
import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ModuloEmpresaRepository } from "src/@modules/empresa/modulos/moduloEmpresaRepository";
import { DefinirModulosEmpresaUsecase } from "../definirModulos/definirModulosEmpresa.usecase";
import { DefinirModulosEmpresaRepository } from "../definirModulos/definirModulosEmpresaRepository";
import * as bcryptjs from "bcryptjs";
import { DominioRegrasRepository } from "src/@modules/empresa/dominio/dominioRegras";
import { CadastrarEmpresaUsecase } from "../cadastrarEmpresa/cadastrarEmpresa.usecase";
import { CadastrarEmpresaRepository } from "../cadastrarEmpresa/cadastrarEmpresaRepository";

const companyUuid = "ad000000-0000-4000-8000-000000000a01";
const rollbackUuid = "ad000000-0000-4000-8000-000000000a03";
const rollbackAdminUuid = "ad000000-0000-4000-8000-000000000b03";
const dominioTeste = "http://teste-admin-a.localhost:9000";
const cadastradas: { uuid?: string; adminUuid?: string } = {};
const todasEmpresas = () => [companyUuid, rollbackUuid, ...(cadastradas.uuid ? [cadastradas.uuid] : [])];
const todosAdmins = () => [rollbackAdminUuid, ...(cadastradas.adminUuid ? [cadastradas.adminUuid] : [])];

async function limpar() {
  const empresas = todasEmpresas();
  await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = ANY($1::uuid[])`, [empresas]);
  await dataSource.query(`DELETE FROM auth_users WHERE uuid = ANY($1::uuid[])`, [todosAdmins()]);
  await dataSource.query(`DELETE FROM auth_company_modulos WHERE company_uuid = ANY($1::uuid[])`, [empresas]);
  await dataSource.query(`DELETE FROM auth_company_domains WHERE company_uuid = ANY($1::uuid[])`, [empresas]);
  await dataSource.query(`DELETE FROM auth_companies WHERE uuid = ANY($1::uuid[])`, [empresas]);
}
const fakeCache = { saveObject: jest.fn(), findKey: jest.fn(), deleteKey: jest.fn() };

let connections: ConnectionHub;
let definirModulos: DefinirModulosEmpresaUsecase;

describe("Admin (banco)", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    await limpar();
    await dataSource.query(
      `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, 'test-admin-a', 'Empresa Teste Admin', '00000000000000') ON CONFLICT DO NOTHING`,
      [companyUuid],
    );
    await dataSource.query(`INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) VALUES ($1, $2, 'igreja')`, [randomUUID(), companyUuid]);
    connections = new ConnectionHub({ database: dataSource, cache: fakeCache as any });
    definirModulos = new DefinirModulosEmpresaUsecase(new DefinirModulosEmpresaRepository(connections));
  });

  afterAll(async () => {
    await limpar();
    await dataSource.destroy();
  });

  describe("definir módulos", () => {
    const linhasIgreja = () =>
      dataSource.query(`SELECT deleted_at FROM auth_company_modulos WHERE company_uuid = $1 AND modulo = 'igreja'`, [companyUuid]);

    test("troca os módulos, soft-deleta o removido e limpa o cache", async () => {
      await definirModulos.execute({ companyUuid, companyUuidLogada: "outra", modulos: ["imoveis", "admin"] });

      expect(await new ModuloEmpresaRepository(connections).listarModulos(companyUuid)).toEqual(["admin", "imoveis"]);
      const linhas = await linhasIgreja();
      expect(linhas).toHaveLength(1);
      expect(linhas[0].deleted_at).not.toBeNull();
      expect(fakeCache.deleteKey).toHaveBeenCalledWith(`modulos:${companyUuid}`);
    });

    test("reativar módulo insere linha nova", async () => {
      await definirModulos.execute({ companyUuid, companyUuidLogada: "outra", modulos: ["igreja"] });

      expect(await new ModuloEmpresaRepository(connections).listarModulos(companyUuid)).toEqual(["igreja"]);
      const linhas = await linhasIgreja();
      expect(linhas).toHaveLength(2);
      expect(linhas.filter((l: any) => l.deleted_at === null)).toHaveLength(1);
    });
  });

  describe("cadastrar empresa", () => {
    const senha = "senha-segura-1";
    const montar = () => {
      const repo = new CadastrarEmpresaRepository(connections);
      return { repo, usecase: new CadastrarEmpresaUsecase(repo, new DominioRegrasRepository(connections)) };
    };
    const input = (dominio: string) => ({
      empresa: { name: "Empresa Cadastrada", cpfCnpj: "00000000000191" },
      dominio,
      modulos: ["igreja", "admin"],
      admin: { name: "Admin Teste", email: "admin-teste-a@exemplo.com", password: senha },
    });
    const contar = async (sql: string, params: unknown[]) => Number((await dataSource.query(sql, params))[0].total);

    test("cadastro completo grava empresa, domínio, módulos e admin", async () => {
      const { usecase } = montar();
      const res = await usecase.execute(input(dominioTeste));
      cadastradas.uuid = res.uuid;
      cadastradas.adminUuid = res.adminUuid;

      expect(await contar(`SELECT count(*) AS total FROM auth_companies WHERE uuid = $1 AND tenant_id = $1::text`, [res.uuid])).toBe(1);
      const [dominio] = await dataSource.query(`SELECT domain, active FROM auth_company_domains WHERE company_uuid = $1`, [res.uuid]);
      expect(dominio).toEqual({ domain: dominioTeste, active: true });
      expect(await contar(`SELECT count(*) AS total FROM auth_company_modulos WHERE company_uuid = $1`, [res.uuid])).toBe(2);
      const [user] = await dataSource.query(`SELECT password FROM auth_users WHERE uuid = $1`, [res.adminUuid]);
      expect(await bcryptjs.compare(senha, user.password)).toBe(true);
      const [vinculo] = await dataSource.query(`SELECT position, is_accepted FROM auth_users_companies WHERE company_uuid = $1 AND user_uuid = $2`, [res.uuid, res.adminUuid]);
      expect(vinculo.position).toBe("admin");
      expect(vinculo.is_accepted).toBe(true);
    });

    test("rollback: falha no meio não grava nada", async () => {
      const { repo } = montar();
      await expect(
        repo.cadastrar({
          uuid: rollbackUuid,
          adminUuid: rollbackAdminUuid,
          empresa: { name: "Rollback", cpfCnpj: "00000000000191", commercialName: null, fantasyName: null, stateRegistration: null, email: null, phone: null, uf: null, address: null },
          dominio: "http://teste-admin-rollback.localhost:9000",
          modulos: ["igreja", "igreja"],
          admin: { name: "Rollback", email: "rollback@exemplo.com", passwordHash: "x" },
        }),
      ).rejects.toThrow();

      expect(await contar(`SELECT count(*) AS total FROM auth_companies WHERE uuid = $1`, [rollbackUuid])).toBe(0);
      expect(await contar(`SELECT count(*) AS total FROM auth_company_domains WHERE company_uuid = $1`, [rollbackUuid])).toBe(0);
      expect(await contar(`SELECT count(*) AS total FROM auth_users WHERE uuid = $1`, [rollbackAdminUuid])).toBe(0);
    });

    test("domínio já em uso (formato diferente) devolve 409", async () => {
      const { usecase } = montar();
      await expect(usecase.execute(input("HTTP://Teste-Admin-A.localhost:9000/"))).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
