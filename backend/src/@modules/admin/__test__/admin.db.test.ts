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
import { AdminQuery } from "../admin.query";

const companyUuid = "ad000000-0000-4000-8000-000000000a01";
const rollbackUuid = "ad000000-0000-4000-8000-000000000a03";
const rollbackAdminUuid = "ad000000-0000-4000-8000-000000000b03";
const dominioTeste = "http://teste-admin-a.localhost:9000";
const cadastradas: { uuid?: string; adminUuid?: string } = {};
const todasEmpresas = () => [companyUuid, rollbackUuid, ...(cadastradas.uuid ? [cadastradas.uuid] : [])];
const todosAdmins = () => [rollbackAdminUuid, ...(cadastradas.adminUuid ? [cadastradas.adminUuid] : [])];

async function limpar() {
  // Sobras de execuções interrompidas: empresas que ficaram com o domínio fixo de teste.
  const sobras = await dataSource.query(`SELECT company_uuid FROM auth_company_domains WHERE lower(rtrim(domain, '/')) = $1`, [dominioTeste]);
  const empresas = [...todasEmpresas(), ...sobras.map((s: { company_uuid: string }) => s.company_uuid)];
  const usuarios = await dataSource.query(
    `SELECT user_uuid FROM auth_users_companies WHERE company_uuid = ANY($1::uuid[]) AND user_uuid <> ALL($2::uuid[])`,
    [sobras.map((s: { company_uuid: string }) => s.company_uuid), todosAdmins()],
  );
  await dataSource.query(`DELETE FROM auth_users_companies WHERE company_uuid = ANY($1::uuid[])`, [empresas]);
  await dataSource.query(`DELETE FROM auth_users WHERE uuid = ANY($1::uuid[])`, [[...todosAdmins(), ...usuarios.map((u: { user_uuid: string }) => u.user_uuid)]]);
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

  describe("consultas /admin/empresas", () => {
    const deletadaUuid = "ad000000-0000-4000-8000-000000000a04";
    let query: AdminQuery;

    beforeAll(async () => {
      query = new AdminQuery(connections);
      await dataSource.query(
        `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj, deleted_at) VALUES ($1, 'test-admin-del', 'Empresa teste-admin-a Deletada', '00000000000000', now()) ON CONFLICT DO NOTHING`,
        [deletadaUuid],
      );
    });

    afterAll(async () => {
      await dataSource.query(`DELETE FROM auth_companies WHERE uuid = $1`, [deletadaUuid]);
    });

    test("lista por domínio com módulos e domínios ativos, ignorando deletadas", async () => {
      const { data, total } = await query.listarEmpresas({ busca: "teste-admin-a", pagina: 1, porPagina: 20 });

      expect(total).toBe(1);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({ uuid: cadastradas.uuid, name: "Empresa Cadastrada", cpfCnpj: "00000000000191", modulos: ["admin", "igreja"], dominios: [dominioTeste] });
      expect(data.find((e) => e.uuid === deletadaUuid)).toBeUndefined();
    });

    test("busca por CNPJ e por nome", async () => {
      expect((await query.listarEmpresas({ busca: "00000000000191", pagina: 1, porPagina: 100 })).data.map((e) => e.uuid)).toContain(cadastradas.uuid);
      expect((await query.listarEmpresas({ busca: "Empresa Cadastrada", pagina: 1, porPagina: 100 })).data.map((e) => e.uuid)).toContain(cadastradas.uuid);
    });

    test("paginação respeita porPagina e total", async () => {
      const { data, total } = await query.listarEmpresas({ pagina: 1, porPagina: 1 });
      expect(data).toHaveLength(1);
      expect(total).toBeGreaterThanOrEqual(2);
    });

    test("detalhe traz dados, módulos e domínios com active", async () => {
      const detalhe = await query.detalharEmpresa(cadastradas.uuid!);
      expect(detalhe).toMatchObject({ uuid: cadastradas.uuid, name: "Empresa Cadastrada", modulos: ["admin", "igreja"] });
      expect(detalhe!.dominios).toEqual([expect.objectContaining({ domain: dominioTeste, active: true })]);
    });

    test("uuid inexistente ou deletada: detalhe null e existe false", async () => {
      expect(await query.detalharEmpresa("ad000000-0000-4000-8000-0000000000ff")).toBeNull();
      expect(await query.detalharEmpresa(deletadaUuid)).toBeNull();
      expect(await query.existeEmpresa(deletadaUuid)).toBe(false);
      expect(await query.existeEmpresa(cadastradas.uuid!)).toBe(true);
    });
  });
});
