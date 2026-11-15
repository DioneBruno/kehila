import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../../incluirAprisco/incluirApriscoRepository";
import { DeletarApriscoUsecase } from "../deletarAprisco.usecase";
import { DeletarApriscoRepository } from "../deletarApriscoRepository";

const companyUuid = "9e2b4c71-5d3a-4e8f-a1b6-3c7d9f0e2a58";
const uuidInexistente = "00000000-0000-0000-0000-000000000000";
let connections: ConnectionHub;

describe("Deve testar DeletarApriscoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  const incluir = () => new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({ companyUuid, nome: "Aprisco a deletar" });

  test("Deve deletar (soft delete) um Aprisco", async () => {
    const { uuid } = await incluir();

    const usecase = new DeletarApriscoUsecase(new DeletarApriscoRepository(connections));
    await usecase.execute({ companyUuid, apriscoUuid: uuid });

    const [row] = await dataSource.query(`SELECT deleted_at FROM apriscos WHERE uuid = $1`, [uuid]);
    expect(row.deleted_at).not.toBeNull();
  });

  test("Deve lançar erro ao deletar Aprisco já deletado", async () => {
    const { uuid } = await incluir();
    const usecase = new DeletarApriscoUsecase(new DeletarApriscoRepository(connections));
    await usecase.execute({ companyUuid, apriscoUuid: uuid });

    await expect(usecase.execute({ companyUuid, apriscoUuid: uuid })).rejects.toThrow("Aprisco não encontrado");
  });

  test("Deve lançar erro ao deletar Aprisco de outra empresa", async () => {
    const { uuid } = await incluir();
    const usecase = new DeletarApriscoUsecase(new DeletarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid: uuidInexistente, apriscoUuid: uuid })).rejects.toThrow("Aprisco não encontrado");

    const [row] = await dataSource.query(`SELECT deleted_at FROM apriscos WHERE uuid = $1`, [uuid]);
    expect(row.deleted_at).toBeNull();
  });

  test("Deve lançar erro ao deletar Aprisco inexistente", async () => {
    const usecase = new DeletarApriscoUsecase(new DeletarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente })).rejects.toThrow("Aprisco não encontrado");
  });
});
