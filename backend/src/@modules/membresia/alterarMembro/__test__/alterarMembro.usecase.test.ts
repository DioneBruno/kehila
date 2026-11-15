import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IncluirMembroUsecase } from "../../incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "../../incluirMembro/incluirMembroRepository";
import { AlterarMembroUsecase } from "../alterarMembro.usecase";
import { AlterarMembroRepository } from "../alterarMembroRepository";

const companyUuid = "4b8e2d17-6a3c-4f9e-8d21-9c7b5a3e1f60";
let connections: ConnectionHub;

describe("Deve testar AlterarMembroUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    connections = new ConnectionHub({ database: dataSource });
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = $1`, [companyUuid]);
    await dataSource.destroy();
  });

  test("Deve alterar um Membro", async () => {
    const { uuid } = await new IncluirMembroUsecase(new IncluirMembroRepository(connections)).execute({
      companyUuid,
      nome: "Dione",
      email: "antigo@email.com",
      meta: { campo1: "valor1" },
    });

    const usecase = new AlterarMembroUsecase(new AlterarMembroRepository(connections));
    await usecase.execute({
      companyUuid,
      membroUuid: uuid,
      nome: "  Dione Bruno  ",
      email: "novo@email.com",
      batizado: true,
      enderecoCidade: "cidade",
      meta: { campo2: "valor2" },
    });

    const [row] = await dataSource.query(`SELECT * FROM auth_pessoas WHERE uuid = $1`, [uuid]);
    expect(row.nome).toBe("Dione Bruno");
    expect(row.email).toBe("novo@email.com");
    expect(row.batizado).toBe(true);
    expect(row.endereco_cidade).toBe("cidade");
    expect(row.meta).toEqual({ campo1: "valor1", campo2: "valor2" });
  });

  test("Deve lançar erro ao alterar Membro inexistente", async () => {
    const usecase = new AlterarMembroUsecase(new AlterarMembroRepository(connections));
    await expect(usecase.execute({ companyUuid, membroUuid: "00000000-0000-0000-0000-000000000000", nome: "X" })).rejects.toThrow(
      "Membro não encontrado",
    );
  });

  test("Deve lançar erro ao alterar nome para vazio", async () => {
    const usecase = new AlterarMembroUsecase(new AlterarMembroRepository(connections));
    await expect(usecase.execute({ companyUuid, membroUuid: "00000000-0000-0000-0000-000000000000", nome: "  " })).rejects.toThrow(
      "O nome do membro é obrigatório",
    );
  });
});
