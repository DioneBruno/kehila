import dataSource from "src/@infra/database/datasource";
import { IncluirMembroUsecase } from "../incluirMembro.usecase";
import { IncluirMembroRepository } from "../incluirMembroRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const companyUuid = "1df862f9-534d-4b47-a282-c74278f666ac";
let repo: IncluirMembroRepository;

describe("Deve testar IncluirMembroUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connections = new ConnectionHub({ database: dataSource });
    repo = new IncluirMembroRepository(connections);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_pessoas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve incluir novo Membro", async () => {
    const usecase = new IncluirMembroUsecase(repo);
    const input = {
      companyUuid,
      nome: "Dione",
      email: "email",
      telefone: "telefone",
      cpf: "cpf",
      estadoCivil: "Casado",
      dataNascimento: "1990-01-01",
      enderecoCep: "cep",
      enderecoLogradouro: "logradouro",
      enderecoNumero: "numero",
      enderecoBairro: "bairro",
      enderecoCidade: "cidade",
      enderecoUf: "uf",
      meta: {
        campo1: "valor1",
        campo2: "valor2",
      },
    };
    await usecase.execute(input);

    const membroModel = await dataSource.query(`SELECT * FROM auth_pessoas WHERE company_uuid = '${companyUuid}'`);
    expect(membroModel.length).toBe(1);
  });
});
