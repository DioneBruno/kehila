import dataSource from "src/@infra/database/datasource";
import { GerarCobrancaUsecase } from "../gerarCobranca.usecase";
import { GerarCobrancaRepository } from "../gerarCobrancaRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import axios from "axios";

const companyUuid = "e8d34640-f273-4d62-8b06-5bb19d6169ad";
let repo: GerarCobrancaRepository;

describe("Deve testar GerarCobrancaUsecase com Gateway Assas", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios.create({
      baseURL: process.env.SYSTEM_URL_API,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    repo = new GerarCobrancaRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve criar cobranca no asaas", async () => {
    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid: "f3c16fee-6691-460c-a870-e160c1921580",
      origem: "origem",
      origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
      pagadorNome: "Pagador de teste 001",
      pagadorDocumento: "88247744317",
      pagadorEmail: "emailpagador@gmail.com",
      pagadorTelefone: "65985455877",
      valor: 154.36,
    };
    await usecase.execute(input);
  });
});
