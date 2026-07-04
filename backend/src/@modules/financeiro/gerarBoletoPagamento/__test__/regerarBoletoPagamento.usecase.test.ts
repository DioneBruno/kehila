import axios from "axios";
import dataSource from "src/@infra/database/datasource";
import { stub, SinonStub, useFakeTimers } from "sinon";
import { GerarBoletoPagamentoUsecase } from "../gerarBoletoPagamento.usecase";
import { GerarBoletoPagamentoRepository } from "../gerarBoletoPagamentoRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const companyUuid = "76cea2ee-8ab0-4e9d-98ea-2a9977697465";
let repo: GerarBoletoPagamentoRepository;

describe("Deve testar RegerarBoletoPagamentoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios.create({ baseURL: "https://api-sandbox.asaas.com" });
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    repo = new GerarBoletoPagamentoRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve solicitar novo boleto do pagamento para o Gateway", async () => {
    const cobrancaUuid = "0ae69e90-f876-490b-8509-660604a52e57";
    const pagamentoUuid = "f6681aa7-5abc-4d2d-a135-37a19ab6f6e0";

    const clienteId = "cus_000005113026";
    const http = repo.connectionHub.http as any;

    const getStub: SinonStub = stub(http, "get");
    getStub.callsFake((url: string) => {
      if (url.includes("v3/customers")) return Promise.resolve({ data: { data: [{ id: clienteId }] } });
      return Promise.resolve({
        data: {
          data: [
            {
              id: "pay_000001",
              nossoNumero: "123456",
              bankSlipUrl: "https://boleto.url",
              dueDate: "2026-07-12",
              value: 154.36,
              netValue: 152.0,
              pixTransaction: { qrCode: { payload: "pix-code" } },
            },
          ],
        },
      });
    });
    const postStub = stub(http, "post").resolves({
      data: { id: "pay_001", nossoNumero: "001", bankSlipUrl: "url1", dueDate: "2026-07-12", value: 145.78, netValue: 144.18, pixTransaction: null },
    });

    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid)
      VALUES ('${cobrancaUuid}', '${companyUuid}', '${companyUuid}')`);
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, vencimento, valor)
      VALUES ('${pagamentoUuid}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'boleto', '2026-07-04', 145.78)`);

    const usecase = new GerarBoletoPagamentoUsecase(repo);
    const input = {
      pagamentoUuid,
    };
    await usecase.execute(input);

    // Verificando Request feita para o Gateway
    expect(postStub.firstCall.args[0]).toContain("v3/payments");
    expect(postStub.firstCall.args[1].billingType).toBe("BOLETO");
    expect(postStub.firstCall.args[1].customer).toBe(clienteId);
    expect(postStub.firstCall.args[1].value).toBe(145.78);
    expect(postStub.firstCall.args[1].dueDate).toBe("2026-07-12");
    expect(postStub.firstCall.args[1].description).toBe("Breve descrição para a cobrança");

    const [pagamentoModel] = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE uuid = '${pagamentoUuid}'`);
    expect(pagamentoModel.banco_ref).toBe("pay_001");
    expect(pagamentoModel.valor).toBe(145.78);
    expect(pagamentoModel.valor_com_desc_gateway).toBe(144.18);
    expect(pagamentoModel.link_boleto).toBe("url1");
    expect(pagamentoModel.vencimento).toBe("2026-07-12");

    getStub.restore();
    postStub.restore();
  });
});
