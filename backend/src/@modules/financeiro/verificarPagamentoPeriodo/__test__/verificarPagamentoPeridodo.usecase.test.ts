import dataSource from "src/@infra/database/datasource";
import { stub } from "sinon";
import { VerificarPagamentoPeriodoUsecase } from "../verificarPagamentoPeriodo.usecase";
import { VerificarPagamentoPeriodoGateway } from "../verificarPagamentoPeriodoGateway";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { VerificarPagamentoPeriodoRepository } from "../verificarPagamentoPeriodoRepository";
import axios from "axios";
import { randomUUID } from "crypto";

const companyUuid = "0ddd365c-1fe1-4919-ba15-64d6ae023b3c";
let repo: VerificarPagamentoPeriodoRepository;
let gateway: VerificarPagamentoPeriodoGateway;

describe("Deve testar VerificarPagamentoPeridodoUsecse", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios;
    const connections = new ConnectionHub({ database: dataSource, http });
    repo = new VerificarPagamentoPeriodoRepository();
    gateway = new VerificarPagamentoPeriodoGateway(connections);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve montar request correta para Asaas", async () => {
    const asaasData = {
      object: "list",
      hasMore: false,
      totalCount: 9,
      limit: 3,
      offset: 0,
      data: [],
    };
    const getStub = stub(axios, "get").resolves({
      status: 200,
      data: asaasData,
    });

    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, banco_numero, chave_api, ambiente, status)
      VALUES ('${randomUUID()}', '${companyUuid}', '461', '$chave=', 'PROD', 'ativo')`);

    const usecase = new VerificarPagamentoPeriodoUsecase(repo, gateway);
    const input = {
      companyUuid,
      dataInicial: "2026-07-01",
      dataFinal: "2026-07-31",
    };
    await usecase.execute(input);

    expect(getStub.args[0][0]).toBe(
      "https://api.asaas.com/v3/payments?limit=100&offset=0&paymentDate[ge]=2026-07-01&paymentDate[le]=2026-07-31&status=RECEIVED",
    );
    expect(getStub.args[0][1]?.headers?.access_token).toBe("$chave=");
    expect(getStub.args[0][1]?.headers?.["User-Agent"]).toBe("Kehila");
    expect(getStub.args[0][1]?.headers?.["content-type"]).toBe("application/json");

    // publishMessageStub.restore();
    getStub.restore();
  });
});
