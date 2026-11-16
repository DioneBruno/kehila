import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../incluirAprisco/incluirApriscoRepository";
import { DeletarApriscoUsecase } from "../deletarAprisco/deletarAprisco.usecase";
import { DeletarApriscoRepository } from "../deletarAprisco/deletarApriscoRepository";
import { ApriscoQuery } from "../aprisco.query";
import { IncluirMembroUsecase } from "src/@modules/membresia/incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "src/@modules/membresia/incluirMembro/incluirMembroRepository";
import { VincularIntegranteUsecase } from "../vincularIntegrante/vincularIntegrante.usecase";
import { VincularIntegranteRepository } from "../vincularIntegrante/vincularIntegranteRepository";
import { DisvincularIntegranteUsecase } from "../disvincularIntegrante/disvincularIntegrante.usecase";
import { DisvincularIntegranteRepository } from "../disvincularIntegrante/disvincularIntegranteRepository";
import { RegistrarPresencaUsecase } from "../registrarPresenca/registrarPresenca.usecase";
import { RegistrarPresencaRepository } from "../registrarPresenca/registrarPresencaRepository";

const companyUuid = "3f7a1c92-8d4e-4b60-9a2f-5e1b7c3d9f04";
const outraCompanyUuid = "6b2e9d14-0a7c-4f38-b5e1-8c4a2f6d0e79";
const userUuid = "9c4d2e71-5b8a-4f13-a6e0-2d7f1b9c3e58";
let connections: ConnectionHub;

describe("Deve testar ApriscoQuery", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM aprisco_presencas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM aprisco_integrantes WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = $1`, [userUuid]);
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = $1`, [companyUuid]);
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

  test("Deve listar integrantes do Aprisco, liderança primeiro, sem os desvinculados", async () => {
    const { uuid: apriscoUuid } = await new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({
      companyUuid,
      nome: "Integrantes",
    });
    const incluirPessoa = async (nome: string) =>
      (await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({ companyUuid, nome })).uuid;
    const vincular = new VincularIntegranteUsecase(new VincularIntegranteRepository(connections));

    const ana = await incluirPessoa("Ana");
    const bruno = await incluirPessoa("Bruno");
    const carla = await incluirPessoa("Carla");
    await vincular.execute({ companyUuid, apriscoUuid, pessoaUuid: ana });
    await vincular.execute({ companyUuid, apriscoUuid, pessoaUuid: bruno, papel: "LIDER" });
    const { uuid: removido } = await vincular.execute({ companyUuid, apriscoUuid, pessoaUuid: carla });
    await new DisvincularIntegranteUsecase(new DisvincularIntegranteRepository(connections)).execute({
      companyUuid,
      apriscoUuid,
      integranteUuid: removido,
    });

    const integrantes = await new ApriscoQuery(connections).listarIntegrantes(companyUuid, apriscoUuid);
    expect(integrantes.map((i) => [i.nome, i.papel])).toEqual([
      ["Bruno", "LIDER"],
      ["Ana", "MEMBRO"],
    ]);
    expect(integrantes[0].pessoaUuid).toBe(bruno);
    expect(await new ApriscoQuery(connections).listarIntegrantes(outraCompanyUuid, apriscoUuid)).toEqual([]);
  });

  test("Deve listar apenas os Apriscos em que o usuário logado é LIDER", async () => {
    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ($1, 'Lider', 'lider.aprisco@teste.com')`, [userUuid]);
    const incluir = new IncluirApriscoUsecase(new IncluirApriscoRepository(connections));
    const { uuid: liderado } = await incluir.execute({ companyUuid, nome: "Liderado" });
    const { uuid: comoMembro } = await incluir.execute({ companyUuid, nome: "Como membro" });
    const { uuid: deletado } = await incluir.execute({ companyUuid, nome: "Deletado" });
    const pessoa = (
      await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({
        companyUuid,
        nome: "Lider",
        email: "lider.aprisco@teste.com",
      })
    ).uuid;
    const outraPessoa = (await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({ companyUuid, nome: "Outro" })).uuid;
    const vincular = new VincularIntegranteUsecase(new VincularIntegranteRepository(connections));
    await vincular.execute({ companyUuid, apriscoUuid: liderado, pessoaUuid: pessoa, papel: "LIDER" });
    await vincular.execute({ companyUuid, apriscoUuid: comoMembro, pessoaUuid: pessoa, papel: "MEMBRO" });
    await vincular.execute({ companyUuid, apriscoUuid: comoMembro, pessoaUuid: outraPessoa, papel: "LIDER" });
    await vincular.execute({ companyUuid, apriscoUuid: deletado, pessoaUuid: pessoa, papel: "LIDER" });
    await new DeletarApriscoUsecase(new DeletarApriscoRepository(connections)).execute({ companyUuid, apriscoUuid: deletado });

    const query = new ApriscoQuery(connections);
    const apriscos = await query.listarApriscosLiderados(companyUuid, userUuid);
    expect(apriscos.map((a) => a.uuid)).toEqual([liderado]);
    expect(await query.listarApriscosLiderados(outraCompanyUuid, userUuid)).toEqual([]);
  });

  test("Deve listar as presenças apenas da reunião informada", async () => {
    const { uuid: apriscoUuid } = await new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({
      companyUuid,
      nome: "Presenças",
    });
    const incluirMembro = new IncluirMembroUsecase(new IncluirMembroRepository(connections));
    const ana = (await incluirMembro.execute({ companyUuid, nome: "Ana Presença" })).uuid;
    const bruno = (await incluirMembro.execute({ companyUuid, nome: "Bruno Presença" })).uuid;
    const vincular = new VincularIntegranteUsecase(new VincularIntegranteRepository(connections));
    await vincular.execute({ companyUuid, apriscoUuid, pessoaUuid: ana });
    await vincular.execute({ companyUuid, apriscoUuid, pessoaUuid: bruno });

    const registrar = new RegistrarPresencaUsecase(new RegistrarPresencaRepository(connections));
    await registrar.execute({
      companyUuid,
      apriscoUuid,
      dataReuniao: "2026-11-12",
      integrantes: [
        { pessoaUuid: ana, presenca: true },
        { pessoaUuid: bruno, presenca: false },
      ],
      visitantes: 3,
    });
    await registrar.execute({ companyUuid, apriscoUuid, dataReuniao: "2026-11-05", integrantes: [{ pessoaUuid: bruno, presenca: true }] });

    const query = new ApriscoQuery(connections);
    const presencas = await query.listarPresencas(companyUuid, apriscoUuid, "2026-11-12");
    expect(presencas).toHaveLength(3);
    expect(presencas).toEqual(
      expect.arrayContaining([
        { tipo: "INTEGRANTE", pessoaUuid: ana, presenca: true, quantidade: null },
        { tipo: "INTEGRANTE", pessoaUuid: bruno, presenca: false, quantidade: null },
        { tipo: "VISITANTE", pessoaUuid: null, presenca: true, quantidade: 3 },
      ]),
    );
    expect(await query.listarPresencas(outraCompanyUuid, apriscoUuid, "2026-11-12")).toEqual([]);
  });
});
