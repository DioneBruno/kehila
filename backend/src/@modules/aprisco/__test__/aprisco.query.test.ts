import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../incluirAprisco/incluirApriscoRepository";
import { DeletarApriscoUsecase } from "../deletarAprisco/deletarAprisco.usecase";
import { DeletarApriscoRepository } from "../deletarAprisco/deletarApriscoRepository";
import { ApriscoQuery } from "../aprisco.query";

const companyUuid = "3f7a1c92-8d4e-4b60-9a2f-5e1b7c3d9f04";
const outraCompanyUuid = "6b2e9d14-0a7c-4f38-b5e1-8c4a2f6d0e79";
let connections: ConnectionHub;

describe("Deve testar ApriscoQuery", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid IN ($1, $2)`, [companyUuid, outraCompanyUuid]);
    await dataSource.destroy();
  });

  test("Deve listar Apriscos da empresa, ordenados por nome, sem os deletados", async () => {
    const incluir = new IncluirApriscoUsecase(new IncluirApriscoRepository(connections));
    await incluir.execute({ companyUuid, nome: "Zona Sul", latitude: -23.5505199, longitude: -46.6333094 });
    await incluir.execute({ companyUuid, nome: "Alvorada" });
    const { uuid: deletado } = await incluir.execute({ companyUuid, nome: "Bela Vista" });
    await incluir.execute({ companyUuid: outraCompanyUuid, nome: "Outra empresa" });

    await new DeletarApriscoUsecase(new DeletarApriscoRepository(connections)).execute({ companyUuid, apriscoUuid: deletado });

    const apriscos = await new ApriscoQuery(connections).listarApriscos(companyUuid);
    expect(apriscos.map((a) => a.nome)).toEqual(["Alvorada", "Zona Sul"]);
    expect(apriscos[1].latitude).toBeCloseTo(-23.5505199, 6);
    expect(typeof apriscos[1].longitude).toBe("number");
    expect(apriscos[0].latitude).toBeNull();
    expect(apriscos[0].status).toBe("ativo");
  });

  test("Deve buscar um Aprisco pelo uuid apenas na própria empresa", async () => {
    const { uuid } = await new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({
      companyUuid,
      nome: "Centro",
      horario: "Quinta-feira 20h",
    });
    const query = new ApriscoQuery(connections);

    const aprisco = await query.buscarAprisco(companyUuid, uuid);
    expect(aprisco?.nome).toBe("Centro");
    expect(aprisco?.horario).toBe("Quinta-feira 20h");

    expect(await query.buscarAprisco(outraCompanyUuid, uuid)).toBeNull();
  });
});
