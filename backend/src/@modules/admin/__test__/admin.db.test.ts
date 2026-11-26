import { randomUUID } from "crypto";
import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ModuloEmpresaRepository } from "src/@modules/empresa/modulos/moduloEmpresaRepository";
import { DefinirModulosEmpresaUsecase } from "../definirModulos/definirModulosEmpresa.usecase";
import { DefinirModulosEmpresaRepository } from "../definirModulos/definirModulosEmpresaRepository";

const companyUuid = "ad000000-0000-4000-8000-000000000a01";
const fakeCache = { saveObject: jest.fn(), findKey: jest.fn(), deleteKey: jest.fn() };

let connections: ConnectionHub;
let definirModulos: DefinirModulosEmpresaUsecase;

describe("Admin (banco)", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    await dataSource.query(
      `INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj) VALUES ($1, 'test-admin-a', 'Empresa Teste Admin', '00000000000000') ON CONFLICT DO NOTHING`,
      [companyUuid],
    );
    await dataSource.query(`INSERT INTO auth_company_modulos (uuid, company_uuid, modulo) VALUES ($1, $2, 'igreja')`, [randomUUID(), companyUuid]);
    connections = new ConnectionHub({ database: dataSource, cache: fakeCache as any });
    definirModulos = new DefinirModulosEmpresaUsecase(new DefinirModulosEmpresaRepository(connections));
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_company_modulos WHERE company_uuid IN ($1)`, [companyUuid]);
    await dataSource.query(`DELETE FROM auth_companies WHERE uuid IN ($1)`, [companyUuid]);
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
});
