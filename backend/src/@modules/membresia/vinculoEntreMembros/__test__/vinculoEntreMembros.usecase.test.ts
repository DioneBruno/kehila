import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirMembroUsecase } from "../../incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "../../incluirMembro/incluirMembroRepository";
import { VinculoEntreMembrosUsecase } from "../vinculoEntreMembros.usecase";
import { VinculoEntreMembrosRepository } from "../vinculoEntreMembrosRepository";
import { RemoverVinculoUsecase } from "../../removerVinculo/removerVinculo.usecase";
import { RemoverVinculoRepository } from "../../removerVinculo/removerVinculoRepository";
import { MembresiaQuery } from "../../membresia.query";

const companyUuid = "b2e4c6a8-3d5f-4a1b-8c7e-9f0a1b2c3d4e";
let connections: ConnectionHub;
let usecase: VinculoEntreMembrosUsecase;

const incluirMembro = async (nome: string) =>
  (await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({ companyUuid, nome })).uuid;

describe("Deve testar VinculoEntreMembrosUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
    usecase = new VinculoEntreMembrosUsecase(new VinculoEntreMembrosRepository(connections));
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_pessoas_vinculos WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  test("Deve vincular pai, mãe e filho a um membro", async () => {
    const membro = await incluirMembro("Membro");
    const pai = await incluirMembro("Pai");
    const mae = await incluirMembro("Mãe");
    const filho = await incluirMembro("Filho");

    const { uuids } = await usecase.execute({
      companyUuid,
      membroUuid: membro,
      vinculos: [
        { membroVinculadoUuid: pai, tipo: "PAI" },
        { membroVinculadoUuid: mae, tipo: "mae" },
        { membroVinculadoUuid: filho, tipo: "FILHO" },
      ],
    });

    expect(uuids).toHaveLength(3);
    const rows = await dataSource.query(`SELECT pessoa_vinculada_uuid, tipo FROM auth_pessoas_vinculos WHERE pessoa_uuid = $1 ORDER BY tipo`, [membro]);
    expect(rows).toEqual([
      { pessoa_vinculada_uuid: filho, tipo: "FILHO" },
      { pessoa_vinculada_uuid: mae, tipo: "MAE" },
      { pessoa_vinculada_uuid: pai, tipo: "PAI" },
    ]);

    // Registros inversos
    const inversos = await dataSource.query(
      `SELECT pessoa_uuid, tipo FROM auth_pessoas_vinculos WHERE pessoa_vinculada_uuid = $1 ORDER BY tipo`,
      [membro],
    );
    expect(inversos).toEqual([
      { pessoa_uuid: pai, tipo: "FILHO" },
      { pessoa_uuid: mae, tipo: "FILHO" },
      { pessoa_uuid: filho, tipo: "PAI" },
    ]);
  });

  test("Deve criar o inverso com o tipoInverso informado", async () => {
    const filha = await incluirMembro("Filha");
    const mae = await incluirMembro("Mãe da filha");
    await usecase.execute({ companyUuid, membroUuid: filha, vinculos: [{ membroVinculadoUuid: mae, tipo: "MAE", tipoInverso: "FILHA" }] });

    const vinculosMae = await new MembresiaQuery(connections).listarVinculos(companyUuid, mae);
    expect(vinculosMae).toHaveLength(1);
    expect(vinculosMae[0]).toMatchObject({ tipo: "FILHA", membroVinculadoUuid: filha, membroVinculadoNome: "Filha" });
  });

  test("Deve lançar erro com tipoInverso incompatível", async () => {
    const a = await incluirMembro("A");
    const b = await incluirMembro("B");
    await expect(
      usecase.execute({ companyUuid, membroUuid: a, vinculos: [{ membroVinculadoUuid: b, tipo: "PAI", tipoInverso: "AVO" }] }),
    ).rejects.toThrow("Tipo inverso inválido");
  });

  test("Deve remover o vínculo e o inverso", async () => {
    const membro = await incluirMembro("Membro remover");
    const irma = await incluirMembro("Irmã");
    const { uuids } = await usecase.execute({ companyUuid, membroUuid: membro, vinculos: [{ membroVinculadoUuid: irma, tipo: "IRMA" }] });

    await new RemoverVinculoUsecase(new RemoverVinculoRepository(connections)).execute({ companyUuid, membroUuid: membro, vinculoUuid: uuids[0] });

    const rows = await dataSource.query(`SELECT uuid FROM auth_pessoas_vinculos WHERE pessoa_uuid = ANY($1::uuid[])`, [[membro, irma]]);
    expect(rows).toHaveLength(0);
  });

  test("Deve lançar erro ao vincular o mesmo par duas vezes (inclusive na direção inversa)", async () => {
    const membro = await incluirMembro("Membro 2");
    const pai = await incluirMembro("Pai 2");
    await usecase.execute({ companyUuid, membroUuid: membro, vinculos: [{ membroVinculadoUuid: pai, tipo: "PAI" }] });
    await expect(usecase.execute({ companyUuid, membroUuid: pai, vinculos: [{ membroVinculadoUuid: membro, tipo: "FILHO" }] })).rejects.toThrow(
      "Já existe um vínculo entre esses membros",
    );
  });

  test("Deve lançar erro com tipo inválido", async () => {
    const membro = await incluirMembro("Membro 3");
    const outro = await incluirMembro("Outro 3");
    await expect(usecase.execute({ companyUuid, membroUuid: membro, vinculos: [{ membroVinculadoUuid: outro, tipo: "PRIMO_DISTANTE" }] })).rejects.toThrow(
      "Tipo de vínculo inválido",
    );
  });

  test("Deve lançar erro ao vincular membro a ele mesmo", async () => {
    const membro = await incluirMembro("Membro 4");
    await expect(usecase.execute({ companyUuid, membroUuid: membro, vinculos: [{ membroVinculadoUuid: membro, tipo: "PAI" }] })).rejects.toThrow(
      "Um membro não pode ser vinculado a ele mesmo",
    );
  });

  test("Deve lançar erro quando membro não existe", async () => {
    const membro = await incluirMembro("Membro 5");
    await expect(
      usecase.execute({ companyUuid, membroUuid: membro, vinculos: [{ membroVinculadoUuid: "00000000-0000-0000-0000-000000000000", tipo: "PAI" }] }),
    ).rejects.toThrow("Membro não encontrado");
  });
});
