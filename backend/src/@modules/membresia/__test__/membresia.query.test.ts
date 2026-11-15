import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirMembroUsecase } from "../incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "../incluirMembro/incluirMembroRepository";
import { DeletarMembroUsecase } from "../deletarMembro/deletarMembro.usecase";
import { DeletarMembroRepository } from "../deletarMembro/deletarMembroRepository";
import { MembresiaQuery } from "../membresia.query";

const companyUuid = "9e1d4c7a-3b52-4f86-a0d9-6c2e8b4f1a73";
const outraCompanyUuid = "2a6f8e31-7c94-4b1d-9e5a-0d3c6b8f2e47";
let connections: ConnectionHub;

describe("Deve testar MembresiaQuery", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid IN ($1, $2)`, [companyUuid, outraCompanyUuid]);
    await dataSource.destroy();
  });

  test("Deve listar Membros da empresa, ordenados por nome, sem os deletados", async () => {
    const incluir = new IncluirMembroUsecase(new IncluirMembroRepository(connections));
    await incluir.execute({ companyUuid, nome: "Zélia", dataNascimento: "1990-01-01", meta: { campo1: "valor1" } });
    await incluir.execute({ companyUuid, nome: "Ana" });
    const { uuid: deletado } = await incluir.execute({ companyUuid, nome: "Bruno" });
    await incluir.execute({ companyUuid: outraCompanyUuid, nome: "Outra empresa" });

    await new DeletarMembroUsecase(new DeletarMembroRepository(connections)).execute({ companyUuid, membroUuid: deletado });

    const membros = await new MembresiaQuery(connections).listarMembros(companyUuid);

    expect(membros.map((m) => m.nome)).toEqual(["Ana", "Zélia"]);
    expect(membros[1].dataNascimento).toBe("1990-01-01");
    expect(membros[1].meta).toEqual({ campo1: "valor1" });
  });
});
