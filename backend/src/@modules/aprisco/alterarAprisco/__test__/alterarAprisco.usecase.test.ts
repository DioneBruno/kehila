import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../../incluirAprisco/incluirApriscoRepository";
import { AlterarApriscoUsecase } from "../alterarAprisco.usecase";
import { AlterarApriscoRepository } from "../alterarApriscoRepository";

const companyUuid = "7c3a9e51-2b8d-4f16-9a4e-5d1c8b2f7e93";
const uuidInexistente = "00000000-0000-0000-0000-000000000000";
let connections: ConnectionHub;

describe("Deve testar AlterarApriscoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  const incluir = () =>
    new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({
      companyUuid,
      nome: "Aprisco Centro",
      diaSemana: "Quinta",
      horario: "20:00",
      endereco: "Rua das Flores, 123",
      latitude: -23.5505199,
      longitude: -46.6333094,
    });

  test("Deve alterar um Aprisco", async () => {
    const { uuid } = await incluir();

    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await usecase.execute({
      companyUuid,
      apriscoUuid: uuid,
      nome: "  Aprisco Norte  ",
      diaSemana: "Sexta",
      horario: "19:30",
      latitude: -22.9068467,
      longitude: -43.1728965,
      status: "inativo",
    });

    const [row] = await dataSource.query(`SELECT * FROM apriscos WHERE uuid = $1`, [uuid]);
    expect(row.nome).toBe("Aprisco Norte");
    expect(row.dia_semana).toBe("Sexta");
    expect(row.horario).toBe("19:30");
    expect(row.endereco).toBe("Rua das Flores, 123");
    expect(Number(row.latitude)).toBeCloseTo(-22.9068467, 6);
    expect(Number(row.longitude)).toBeCloseTo(-43.1728965, 6);
    expect(row.status).toBe("inativo");
  });

  test("Deve remover endereço e coordenadas", async () => {
    const { uuid } = await incluir();

    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await usecase.execute({ companyUuid, apriscoUuid: uuid, endereco: "  ", latitude: null, longitude: null });

    const [row] = await dataSource.query(`SELECT * FROM apriscos WHERE uuid = $1`, [uuid]);
    expect(row.endereco).toBeNull();
    expect(row.latitude).toBeNull();
    expect(row.longitude).toBeNull();
    expect(row.nome).toBe("Aprisco Centro");
  });

  test("Deve remover dia da semana e horário", async () => {
    const { uuid } = await incluir();

    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await usecase.execute({ companyUuid, apriscoUuid: uuid, diaSemana: null, horario: " " });

    const [row] = await dataSource.query(`SELECT * FROM apriscos WHERE uuid = $1`, [uuid]);
    expect(row.dia_semana).toBeNull();
    expect(row.horario).toBeNull();
  });

  test("Deve lançar erro com dia da semana inválido", async () => {
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, diaSemana: "xpto" as any })).rejects.toThrow("Dia da semana inválido");
  });

  test("Deve lançar erro com horário inválido", async () => {
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, horario: "25:00" })).rejects.toThrow("Horário inválido");
  });

  test("Deve lançar erro ao alterar Aprisco inexistente", async () => {
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, nome: "X" })).rejects.toThrow("Aprisco não encontrado");
  });

  test("Deve lançar erro ao alterar Aprisco de outra empresa", async () => {
    const { uuid } = await incluir();
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid: uuidInexistente, apriscoUuid: uuid, nome: "X" })).rejects.toThrow("Aprisco não encontrado");
  });

  test("Deve lançar erro ao alterar nome para vazio", async () => {
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, nome: "  " })).rejects.toThrow("O nome do aprisco é obrigatório");
  });

  test("Deve lançar erro ao informar só a latitude", async () => {
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, latitude: -23 })).rejects.toThrow(
      "Latitude e longitude devem ser informadas juntas",
    );
  });

  test("Deve lançar erro com status inválido", async () => {
    const usecase = new AlterarApriscoUsecase(new AlterarApriscoRepository(connections));
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, status: "xpto" as any })).rejects.toThrow("Status do aprisco inválido");
  });
});
