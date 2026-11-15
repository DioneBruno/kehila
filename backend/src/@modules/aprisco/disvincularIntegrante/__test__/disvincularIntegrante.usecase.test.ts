import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../../incluirAprisco/incluirApriscoRepository";
import { IncluirMembroUsecase } from "src/@modules/membresia/incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "src/@modules/membresia/incluirMembro/incluirMembroRepository";
import { VincularIntegranteUsecase } from "../../vincularIntegrante/vincularIntegrante.usecase";
import { VincularIntegranteRepository } from "../../vincularIntegrante/vincularIntegranteRepository";
import { DisvincularIntegranteUsecase } from "../disvincularIntegrante.usecase";
import { DisvincularIntegranteRepository } from "../disvincularIntegranteRepository";

const companyUuid = "7d3f9b1e-2a4c-4e6b-8f0d-5c9a1e3b7f2d";
const uuidInexistente = "00000000-0000-0000-0000-000000000000";
let connections: ConnectionHub;
let usecase: DisvincularIntegranteUsecase;

const incluirAprisco = async () =>
  (await new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({ companyUuid, nome: "Aprisco" })).uuid;

const vincular = async () => {
  const apriscoUuid = await incluirAprisco();
  const pessoaUuid = (await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({ companyUuid, nome: "Integrante" })).uuid;
  const { uuid } = await new VincularIntegranteUsecase(new VincularIntegranteRepository(connections)).execute({ companyUuid, apriscoUuid, pessoaUuid });
  return { apriscoUuid, pessoaUuid, integranteUuid: uuid };
};

describe("Deve testar DisvincularIntegranteUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
    usecase = new DisvincularIntegranteUsecase(new DisvincularIntegranteRepository(connections));
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM aprisco_integrantes WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  test("Deve desvincular (soft delete) o integrante do aprisco", async () => {
    const { apriscoUuid, integranteUuid } = await vincular();
    await usecase.execute({ companyUuid, apriscoUuid, integranteUuid });

    const [row] = await dataSource.query(`SELECT deleted_at FROM aprisco_integrantes WHERE uuid = $1`, [integranteUuid]);
    expect(row.deleted_at).not.toBeNull();
  });

  test("Deve permitir vincular novamente após desvincular", async () => {
    const { apriscoUuid, pessoaUuid, integranteUuid } = await vincular();
    await usecase.execute({ companyUuid, apriscoUuid, integranteUuid });

    const novo = await new VincularIntegranteUsecase(new VincularIntegranteRepository(connections)).execute({ companyUuid, apriscoUuid, pessoaUuid });
    expect(novo.uuid).not.toBe(integranteUuid);
  });

  test("Deve lançar erro ao desvincular integrante já desvinculado", async () => {
    const { apriscoUuid, integranteUuid } = await vincular();
    await usecase.execute({ companyUuid, apriscoUuid, integranteUuid });
    await expect(usecase.execute({ companyUuid, apriscoUuid, integranteUuid })).rejects.toThrow("Integrante não encontrado");
  });

  test("Deve lançar erro quando o integrante é de outro aprisco", async () => {
    const { integranteUuid } = await vincular();
    const outroAprisco = await incluirAprisco();
    await expect(usecase.execute({ companyUuid, apriscoUuid: outroAprisco, integranteUuid })).rejects.toThrow("Integrante não encontrado");

    const [row] = await dataSource.query(`SELECT deleted_at FROM aprisco_integrantes WHERE uuid = $1`, [integranteUuid]);
    expect(row.deleted_at).toBeNull();
  });

  test("Deve lançar erro quando o integrante é de outra empresa", async () => {
    const { apriscoUuid, integranteUuid } = await vincular();
    await expect(usecase.execute({ companyUuid: uuidInexistente, apriscoUuid, integranteUuid })).rejects.toThrow("Integrante não encontrado");
  });

  test("Deve lançar erro quando o integrante não existe", async () => {
    const apriscoUuid = await incluirAprisco();
    await expect(usecase.execute({ companyUuid, apriscoUuid, integranteUuid: uuidInexistente })).rejects.toThrow("Integrante não encontrado");
  });
});
