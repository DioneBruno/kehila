import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../../incluirAprisco/incluirApriscoRepository";
import { VincularIntegranteUsecase } from "../../vincularIntegrante/vincularIntegrante.usecase";
import { VincularIntegranteRepository } from "../../vincularIntegrante/vincularIntegranteRepository";
import { IncluirMembroUsecase } from "src/@modules/membresia/incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "src/@modules/membresia/incluirMembro/incluirMembroRepository";
import { RegistrarPresencaUsecase } from "../registrarPresenca.usecase";
import { RegistrarPresencaRepository } from "../registrarPresencaRepository";

const companyUuid = "7e3b9c1a-2f4d-4a6b-8c0e-5d1f3a7b9e2c";
const uuidInexistente = "00000000-0000-0000-0000-000000000000";
const dataReuniao = "2026-11-12";
let connections: ConnectionHub;
let usecase: RegistrarPresencaUsecase;

const incluirAprisco = async () =>
  (await new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({ companyUuid, nome: "Aprisco" })).uuid;
const incluirPessoa = async (nome: string) =>
  (await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({ companyUuid, nome })).uuid;
const vincular = (apriscoUuid: string, pessoaUuid: string) =>
  new VincularIntegranteUsecase(new VincularIntegranteRepository(connections)).execute({ companyUuid, apriscoUuid, pessoaUuid });
const buscar = async (uuid: string) => {
  const [row]: Record<string, unknown>[] = await dataSource.query(`SELECT * FROM aprisco_presencas WHERE uuid = $1`, [uuid]);
  return row;
};

describe("Deve testar RegistrarPresencaUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
    usecase = new RegistrarPresencaUsecase(new RegistrarPresencaRepository(connections));
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM aprisco_presencas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM aprisco_integrantes WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  test("Deve registrar presença de integrante", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Integrante");
    await vincular(apriscoUuid, pessoaUuid);

    const { uuid } = await usecase.execute({ companyUuid, apriscoUuid, tipo: "integrante", pessoaUuid, dataReuniao });

    const row = await buscar(uuid);
    expect(row).toMatchObject({
      company_uuid: companyUuid,
      aprisco_uuid: apriscoUuid,
      tipo: "INTEGRANTE",
      pessoa_uuid: pessoaUuid,
      presenca: true,
      quantidade: null,
      deleted_at: null,
    });
    expect(row.data_reuniao).toBeTruthy();
  });

  test("Deve atualizar a presença ao registrar novamente na mesma reunião", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Falta");
    await vincular(apriscoUuid, pessoaUuid);

    const primeiro = await usecase.execute({ companyUuid, apriscoUuid, tipo: "INTEGRANTE", pessoaUuid, dataReuniao });
    const segundo = await usecase.execute({ companyUuid, apriscoUuid, tipo: "INTEGRANTE", pessoaUuid, dataReuniao, presenca: false });

    expect(segundo.uuid).toBe(primeiro.uuid);
    expect((await buscar(primeiro.uuid)).presenca).toBe(false);
  });

  test("Deve registrar quantidade de crianças e visitantes sem pessoa", async () => {
    const apriscoUuid = await incluirAprisco();
    const criancas = await usecase.execute({ companyUuid, apriscoUuid, tipo: "criança", dataReuniao, quantidade: 4 });
    const visitantes = await usecase.execute({ companyUuid, apriscoUuid, tipo: "VISITANTE", dataReuniao, quantidade: 2 });

    expect(await buscar(criancas.uuid)).toMatchObject({ tipo: "CRIANCA", pessoa_uuid: null, quantidade: 4 });
    expect(await buscar(visitantes.uuid)).toMatchObject({ tipo: "VISITANTE", pessoa_uuid: null, quantidade: 2 });

    const atualizado = await usecase.execute({ companyUuid, apriscoUuid, tipo: "CRIANCA", dataReuniao, quantidade: 6 });
    expect(atualizado.uuid).toBe(criancas.uuid);
    expect((await buscar(criancas.uuid)).quantidade).toBe(6);
  });

  test("Deve registrar visitante identificado com quantidade 1", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Visitante");
    const { uuid } = await usecase.execute({ companyUuid, apriscoUuid, tipo: "VISITANTE", pessoaUuid, dataReuniao });
    expect(await buscar(uuid)).toMatchObject({ tipo: "VISITANTE", pessoa_uuid: pessoaUuid, quantidade: 1 });
  });

  test("Deve validar os dados de entrada", async () => {
    const apriscoUuid = await incluirAprisco();
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "PASTOR", dataReuniao })).rejects.toThrow("Tipo de presença inválido");
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "INTEGRANTE", dataReuniao })).rejects.toThrow("Pessoa não identificada");
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "VISITANTE", dataReuniao })).rejects.toThrow("A quantidade é obrigatória");
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "VISITANTE", dataReuniao, quantidade: -1 })).rejects.toThrow(
      "Quantidade inválida",
    );
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "VISITANTE", dataReuniao: "2026-02-30", quantidade: 1 })).rejects.toThrow(
      "Data da reunião inválida",
    );
  });

  test("Deve lançar erro quando o aprisco ou a pessoa não existem", async () => {
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, tipo: "CRIANCA", dataReuniao, quantidade: 1 })).rejects.toThrow(
      "Aprisco não encontrado",
    );
    const apriscoUuid = await incluirAprisco();
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "INTEGRANTE", pessoaUuid: uuidInexistente, dataReuniao })).rejects.toThrow(
      "Pessoa não encontrada",
    );
  });

  test("Deve lançar erro quando a pessoa não é integrante do aprisco", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Não integrante");
    await expect(usecase.execute({ companyUuid, apriscoUuid, tipo: "INTEGRANTE", pessoaUuid, dataReuniao })).rejects.toThrow(
      "Pessoa não é integrante deste aprisco",
    );
  });
});
