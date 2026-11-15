import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirApriscoUsecase } from "../../incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "../../incluirAprisco/incluirApriscoRepository";
import { IncluirMembroUsecase } from "src/@modules/membresia/incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "src/@modules/membresia/incluirMembro/incluirMembroRepository";
import { VincularIntegranteUsecase } from "../vincularIntegrante.usecase";
import { VincularIntegranteRepository } from "../vincularIntegranteRepository";

const companyUuid = "4c8a2e6f-7b1d-4f3a-9e5c-2d6b8a0f1c3e";
const outraCompanyUuid = "00000000-0000-0000-0000-000000000001";
const uuidInexistente = "00000000-0000-0000-0000-000000000000";
let connections: ConnectionHub;
let usecase: VincularIntegranteUsecase;

const incluirAprisco = async (nome = "Aprisco") =>
  (await new IncluirApriscoUsecase(new IncluirApriscoRepository(connections)).execute({ companyUuid, nome })).uuid;
const incluirPessoa = async (nome: string, company = companyUuid) =>
  (await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({ companyUuid: company, nome })).uuid;

describe("Deve testar VincularIntegranteUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
    usecase = new VincularIntegranteUsecase(new VincularIntegranteRepository(connections));
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM aprisco_integrantes WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM apriscos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = ANY($1::uuid[])`, [[companyUuid, outraCompanyUuid]]);
    await dataSource.destroy();
  });

  test("Deve vincular uma pessoa ao aprisco com papel", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Líder");

    const { uuid } = await usecase.execute({ companyUuid, apriscoUuid, pessoaUuid, papel: "lider" });

    const [row] = await dataSource.query(`SELECT * FROM aprisco_integrantes WHERE uuid = $1`, [uuid]);
    expect(row).toMatchObject({ company_uuid: companyUuid, aprisco_uuid: apriscoUuid, pessoa_uuid: pessoaUuid, papel: "LIDER", deleted_at: null });
  });

  test("Deve usar MEMBRO como papel padrão", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Membro");
    const { uuid } = await usecase.execute({ companyUuid, apriscoUuid, pessoaUuid });

    const [row] = await dataSource.query(`SELECT papel FROM aprisco_integrantes WHERE uuid = $1`, [uuid]);
    expect(row.papel).toBe("MEMBRO");
  });

  test("Deve lançar erro ao vincular a mesma pessoa duas vezes", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Duplicada");
    await usecase.execute({ companyUuid, apriscoUuid, pessoaUuid });
    await expect(usecase.execute({ companyUuid, apriscoUuid, pessoaUuid, papel: "AUXILIAR" })).rejects.toThrow("Pessoa já é integrante deste aprisco");
  });

  test("Deve permitir novo vínculo após soft delete do anterior", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Retorno");
    const { uuid } = await usecase.execute({ companyUuid, apriscoUuid, pessoaUuid });
    await dataSource.query(`UPDATE aprisco_integrantes SET deleted_at = now() WHERE uuid = $1`, [uuid]);

    const novo = await usecase.execute({ companyUuid, apriscoUuid, pessoaUuid });
    expect(novo.uuid).not.toBe(uuid);
  });

  test("Deve lançar erro com papel inválido", async () => {
    const apriscoUuid = await incluirAprisco();
    const pessoaUuid = await incluirPessoa("Papel inválido");
    await expect(usecase.execute({ companyUuid, apriscoUuid, pessoaUuid, papel: "PASTOR_GERAL" })).rejects.toThrow("Papel inválido");
  });

  test("Deve lançar erro quando o aprisco não existe", async () => {
    const pessoaUuid = await incluirPessoa("Sem aprisco");
    await expect(usecase.execute({ companyUuid, apriscoUuid: uuidInexistente, pessoaUuid })).rejects.toThrow("Aprisco não encontrado");
  });

  test("Deve lançar erro quando a pessoa não existe ou é de outra empresa", async () => {
    const apriscoUuid = await incluirAprisco();
    await expect(usecase.execute({ companyUuid, apriscoUuid, pessoaUuid: uuidInexistente })).rejects.toThrow("Pessoa não encontrada");

    const pessoaOutraEmpresa = await incluirPessoa("Outra empresa", outraCompanyUuid);
    await expect(usecase.execute({ companyUuid, apriscoUuid, pessoaUuid: pessoaOutraEmpresa })).rejects.toThrow("Pessoa não encontrada");
  });
});
