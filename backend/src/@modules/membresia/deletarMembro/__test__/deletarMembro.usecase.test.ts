import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirMembroUsecase } from "../../incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "../../incluirMembro/incluirMembroRepository";
import { DeletarMembroUsecase } from "../deletarMembro.usecase";
import { DeletarMembroRepository } from "../deletarMembroRepository";

const companyUuid = "7c3f9a52-1e4b-4d8a-9b6e-2f1a0c5d8e31";
let connections: ConnectionHub;

describe("Deve testar DeletarMembroUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  test("Deve deletar (soft delete) um Membro", async () => {
    const { uuid } = await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({
      companyUuid,
      nome: "Membro a deletar",
    });

    const usecase = new DeletarMembroUsecase(new DeletarMembroRepository(connections));
    await usecase.execute({ companyUuid, membroUuid: uuid });

    const [row] = await dataSource.query(`SELECT deleted_at FROM auth_pessoas WHERE uuid = $1`, [uuid]);
    expect(row.deleted_at).not.toBeNull();
  });

  test("Deve lançar erro ao deletar Membro inexistente ou já deletado", async () => {
    const usecase = new DeletarMembroUsecase(new DeletarMembroRepository(connections));
    await expect(usecase.execute({ companyUuid, membroUuid: "00000000-0000-0000-0000-000000000000" })).rejects.toThrow("Membro não encontrado");
  });
});
