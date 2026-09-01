import dataSource from "src/@infra/database/datasource";
import { stub } from "sinon";
import { VerificarPagamentoPeriodoUsecase } from "../verificarPagamentoPeriodo.usecase";
import { VerificarPagamentoPeriodoGateway } from "../verificarPagamentoPeriodoGateway";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { VerificarPagamentoPeriodoRepository } from "../verificarPagamentoPeriodoRepository";
import axios from "axios";
import { randomUUID } from "crypto";
import { VerificarPagamentoUsecase } from "../../verificarPagamento/verificarPagamento.usecase";

const companyUuid = "0ddd365c-1fe1-4919-ba15-64d6ae023b3c";
let repo: VerificarPagamentoPeriodoRepository;
let gateway: VerificarPagamentoPeriodoGateway;

describe("Deve testar VerificarPagamentoPeridodoUsecse", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios;
    const connections = new ConnectionHub({ database: dataSource, http });
    repo = new VerificarPagamentoPeriodoRepository(connections);
    gateway = new VerificarPagamentoPeriodoGateway(connections);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test.skip("Deve montar request correta para Asaas - Real", async () => {
    const apiKey = "";
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, banco_numero, chave_api, ambiente, status)
      VALUES ('${randomUUID()}', '${companyUuid}', '461', '${apiKey}', 'PROD', 'ativo')`);

    const usecase = new VerificarPagamentoPeriodoUsecase(repo, gateway);
    const input = {
      companyUuid,
      dataInicial: "2026-08-01",
      dataFinal: "2026-08-07",
    };
    await usecase.execute(input);
  });

  test("Deve montar request correta para Asaas", async () => {
    const asaasData = {
      object: "list",
      hasMore: false,
      totalCount: 9,
      limit: 3,
      offset: 0,
      data: [
        {
          id: "id1",
          value: "value1",
          paymentDate: "2026-08-01",
        },
        {
          id: "id2",
          value: "value2",
          paymentDate: "2026-08-02",
        },
        {
          id: "id3",
          value: "value3",
          paymentDate: "2026-08-03",
        },
      ],
    };
    const getStub = stub(axios, "get").resolves({
      status: 200,
      data: asaasData,
    });

    const verificarPagamentoStub = stub(VerificarPagamentoUsecase.prototype, "execute").resolves();

    const apiKey = "Key";
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, banco_numero, chave_api, ambiente, status)
      VALUES ('${randomUUID()}', '${companyUuid}', '461', '${apiKey}', 'PROD', 'ativo')`);

    const usecase = new VerificarPagamentoPeriodoUsecase(repo, gateway);
    const input = {
      companyUuid,
      dataInicial: "2026-08-01",
      dataFinal: "2026-08-31",
    };
    await usecase.execute(input);

    expect(getStub.args[0][0]).toBe(
      `https://api.asaas.com/v3/payments?limit=100&offset=0&paymentDate[ge]=${input.dataInicial}&paymentDate[le]=${input.dataFinal}&status=RECEIVED`,
    );
    expect(getStub.args[0][1]?.headers?.access_token).toBe(apiKey);
    expect(getStub.args[0][1]?.headers?.["User-Agent"]).toBe("Kehila");
    expect(getStub.args[0][1]?.headers?.["content-type"]).toBe("application/json");

    // publishMessageStub.restore();
    getStub.restore();
    verificarPagamentoStub.restore();
  });

  test("Deve chamar VerificarPagamentoUsecase ", async () => {
    const asaasData = {
      object: "list",
      hasMore: false,
      totalCount: 9,
      limit: 3,
      offset: 0,
      data: [
        {
          id: "id1",
          value: "value1",
          paymentDate: "2026-08-01",
        },
        {
          id: "id2",
          value: "value2",
          paymentDate: "2026-08-02",
        },
        {
          id: "id3",
          value: "value3",
          paymentDate: "2026-08-03",
        },
      ],
    };
    const getStub = stub(axios, "get").resolves({
      status: 200,
      data: asaasData,
    });

    const cobrancaUuid = "45e7d413-2980-414a-b213-0f6b4d0a05d1";
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_documento, pagador_email, pagador_telefone)
      VALUES ('${cobrancaUuid}', '${companyUuid}', '${companyUuid}', 'Pagador de teste 001', '88247744317', 'EMAIL_ADDRESS', '65985455877')`);
    const pagamentoUuidBase = "97d50cc-73e2-49a6-93a0-9b54ab56c533";
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, banco_ref)
      VALUES ('1${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'xpto', 'id1'),
      ('2${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'xpto', 'id2'),
      ('3${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'xpto', 'id3')`);

    const verificarPagamentoStub = stub(VerificarPagamentoUsecase.prototype, "execute").resolves();

    const apiKey = "Key1";
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, banco_numero, chave_api, ambiente, status)
      VALUES ('${randomUUID()}', '${companyUuid}', '461', '${apiKey}', 'PROD', 'ativo')`);

    const usecase = new VerificarPagamentoPeriodoUsecase(repo, gateway);
    const input = {
      companyUuid,
      dataInicial: "2026-08-01",
      dataFinal: "2026-08-31",
    };
    await usecase.execute(input);

    expect(getStub.args[0][0]).toBe(
      `https://api.asaas.com/v3/payments?limit=100&offset=0&paymentDate[ge]=${input.dataInicial}&paymentDate[le]=${input.dataFinal}&status=RECEIVED`,
    );
    expect(getStub.args[0][1]?.headers?.access_token).toBe(apiKey);
    expect(getStub.args[0][1]?.headers?.["User-Agent"]).toBe("Kehila");
    expect(getStub.args[0][1]?.headers?.["content-type"]).toBe("application/json");

    expect(verificarPagamentoStub.callCount).toBe(3);
    expect(verificarPagamentoStub.args[0][0].companyUuid).toBe(companyUuid);
    expect(verificarPagamentoStub.args[0][0].pagamentoUuid).toBe(`1${pagamentoUuidBase}`);

    getStub.restore();
    verificarPagamentoStub.restore();
  });
});
