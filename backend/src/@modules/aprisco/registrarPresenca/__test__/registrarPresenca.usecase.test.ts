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

  test("Deve registrar em lote a presença dos integrantes, crianças e visitantes", async () => {
    const apriscoUuid = await incluirAprisco();
    const ana = await incluirPessoa("Ana");
    const bruno = await incluirPessoa("Bruno");
    await vincular(apriscoUuid, ana);
    await vincular(apriscoUuid, bruno);

    const resultado = await usecase.execute({
      companyUuid,
      apriscoUuid,
      dataReuniao,
      integrantes: [
        { pessoaUuid: ana, presenca: true },
        { pessoaUuid: bruno, presenca: false },
      ],
      criancas: 4,
      visitantes: 2,
    });

    expect(resultado).toHaveLength(4);
    expect(resultado.map((r) => [r.tipo, r.pessoaUuid])).toEqual([
      ["INTEGRANTE", ana],
      ["INTEGRANTE", bruno],
      ["CRIANCA", null],
      ["VISITANTE", null],
    ]);
    expect(await buscar(resultado[0].uuid)).toMatchObject({
      company_uuid: companyUuid,
      aprisco_uuid: apriscoUuid,
      tipo: "INTEGRANTE",
      pessoa_uuid: ana,
      presenca: true,
      quantidade: null,
      deleted_at: null,
    });
    expect(await buscar(resultado[1].uuid)).toMatchObject({ pessoa_uuid: bruno, presenca: false });
    expect(await buscar(resultado[2].uuid)).toMatchObject({ tipo: "CRIANCA", pessoa_uuid: null, quantidade: 4 });
    expect(await buscar(resultado[3].uuid)).toMatchObject({ tipo: "VISITANTE", pessoa_uuid: null, quantidade: 2 });
  });

  test("Deve atualizar os registros ao registrar novamente na mesma reunião", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Falta");
    await vincular(apriscoUuid, pessoaUuid);

    const [primeiro, criancas] = await usecase.execute({ companyUuid, apriscoUuid, dataReuniao, integrantes: [{ pessoaUuid }], criancas: 4 });
    const [segundo, criancasAtualizado] = await usecase.execute({
      companyUuid,
      apriscoUuid,
      dataReuniao,
      integrantes: [{ pessoaUuid, presenca: false }],
      criancas: 6,
    });

    expect(segundo.uuid).toBe(primeiro.uuid);
    expect(criancasAtualizado.uuid).toBe(criancas.uuid);
    expect((await buscar(primeiro.uuid)).presenca).toBe(false);
    expect((await buscar(criancas.uuid)).quantidade).toBe(6);
  });

  test("Deve validar os dados de entrada", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Duplicado");
    await vincular(apriscoUuid, pessoaUuid);
    await expect(usecase.execute({ companyUuid, apriscoUuid, dataReuniao })).rejects.toThrow("Nenhuma presença informada");
    await expect(usecase.execute({ companyUuid, apriscoUuid, dataReuniao, integrantes: [{ pessoaUuid: "" }] })).rejects.toThrow(
      "Pessoa não identificada",
    );
    await expect(usecase.execute({ companyUuid, apriscoUuid, dataReuniao, integrantes: [{ pessoaUuid }, { pessoaUuid }] })).rejects.toThrow(
      "Integrante informado mais de uma vez",
    );
    await expect(usecase.execute({ companyUuid, apriscoUuid, dataReuniao, visitantes: -1 })).rejects.toThrow("Quantidade inválida");
    await expect(usecase.execute({ companyUuid, apriscoUuid, dataReuniao: "2026-02-30", visitantes: 1 })).rejects.toThrow("Data da reunião inválida");
  });

  test("Deve lançar erro quando o aprisco ou a pessoa não existem", async () => {
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, dataReuniao, criancas: 1 })).rejects.toThrow("Aprisco não encontrado");
    const apriscoUuid = await incluirAprisco();
    await expect(usecase.execute({ companyUuid, apriscoUuid, dataReuniao, integrantes: [{ pessoaUuid: uuidInexistente }] })).rejects.toThrow(
      "Pessoa não encontrada",
    );
  });

  test("Não deve gravar nada quando algum integrante não pertence ao aprisco", async () => {
    const apriscoUuid = await incluirAprisco();
    const integrante = await incluirPessoa("Integrante");
    const naoIntegrante = await incluirPessoa("Não integrante");
    await vincular(apriscoUuid, integrante);

    await expect(
      usecase.execute({
        companyUuid,
        apriscoUuid,
        dataReuniao,
        integrantes: [{ pessoaUuid: integrante }, { pessoaUuid: naoIntegrante }],
        criancas: 1,
      }),
    ).rejects.toThrow("Pessoa não é integrante deste aprisco");
    const rows = await dataSource.query(`SELECT uuid FROM aprisco_presencas WHERE aprisco_uuid = $1`, [apriscoUuid]);
    expect(rows).toHaveLength(0);
  });
});
