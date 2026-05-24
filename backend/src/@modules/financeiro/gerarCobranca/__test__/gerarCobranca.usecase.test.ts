import dataSource from "src/@infra/database/datasource";
import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { GerarCobrancaRepository } from "../gerarCobrancaRepository";
import { GerarCobrancaUsecase } from "../gerarCobranca.usecase";

const companyUuid = "e8d34640-f273-4d62-8b06-5bb19d6169ad";
let repo: GerarCobrancaRepository;

describe("Deve testar GerarCobrancaUsecas", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub(dataSource);
    repo = new GerarCobrancaRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve incluir nova cobranca", async () => {
    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid: "f3c16fee-6691-460c-a870-e160c1921580",
      origem: "origem",
      origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
      pagadorNome: "nome do pagador",
      pagadorDocumento: "12345678909",
      pagadorEmail: "email@dopagador.com",
      valor: 154.36,
    };
    await usecase.execute(input);

    const cobrancaModel = await dataSource.query(`SELECT * FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    expect(cobrancaModel.length).toBe(1);
    expect(cobrancaModel[0].user_uuid).toBe(input.userUuid);
    expect(cobrancaModel[0].origem_tipo).toBe(input.origem);
    expect(cobrancaModel[0].origem_uuid).toBe(input.origemUuid);
    expect(cobrancaModel[0].valor).toBe("154.36");
  });
});
