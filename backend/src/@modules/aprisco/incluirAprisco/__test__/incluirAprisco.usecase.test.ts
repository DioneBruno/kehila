import dataSource from "src/@infra/database/datasource";
import { IncluirApriscoUsecase } from "../incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../incluirApriscoRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const companyUuid = "1df862f9-534d-4b47-a282-c74278f666ac";
let repo: IncluirApriscoRepository;

describe("Deve testar IncluirApriscoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connections = new ConnectionHub({ database: dataSource });
    repo = new IncluirApriscoRepository(connections);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  test("Deve incluir novo Aprisco", async () => {
    const usecase = new IncluirApriscoUsecase(repo);
    const { uuid } = await usecase.execute({
      companyUuid,
      nome: "  Aprisco Centro  ",
      horario: "Quinta-feira 20h",
      endereco: "Rua das Flores, 123",
      latitude: -23.5505199,
      longitude: -46.6333094,
    });

    const [aprisco] = await dataSource.query(`SELECT * FROM apriscos WHERE uuid = $1`, [uuid]);
    expect(aprisco).toBeDefined();
    expect(aprisco.company_uuid).toBe(companyUuid);
    expect(aprisco.nome).toBe("Aprisco Centro");
    expect(aprisco.status).toBe("ativo");
    expect(Number(aprisco.latitude)).toBeCloseTo(-23.5505199, 6);
    expect(Number(aprisco.longitude)).toBeCloseTo(-46.6333094, 6);
    expect(aprisco.index).toBeGreaterThan(0);
  });

  test("Não deve incluir Aprisco sem nome", async () => {
    const usecase = new IncluirApriscoUsecase(repo);
    await expect(usecase.execute({ companyUuid, nome: " " })).rejects.toThrow("O nome do aprisco é obrigatório");
  });

  test("Não deve incluir Aprisco com latitude inválida", async () => {
    const usecase = new IncluirApriscoUsecase(repo);
    await expect(usecase.execute({ companyUuid, nome: "Aprisco", latitude: 100, longitude: 0 })).rejects.toThrow("Latitude inválida");
  });
});
