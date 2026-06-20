import dataSource from "src/@infra/database/datasource";
import { stub, useFakeTimers } from "sinon";
import { VerificarPagamentoRepostiory } from "../verificarPagamentoRepository";
import { VerificarPagamentoUsecase } from "../verificarPagamento.usecase";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { VerificarPagamentoGateway } from "../verificarPagamentoGateway";

const companyUuid = "c265edea-8690-47ed-8593-944551771cd2";
let repo: VerificarPagamentoRepostiory;
let gateway: VerificarPagamentoGateway;
let clock: sinon.SinonFakeTimers;

describe("Deve testar VerificarPagamentoUsecase", () => {
  beforeAll(async () => {
    clock = useFakeTimers({ now: new Date("2026-06-20"), toFake: ["Date"] });
    await dataSource.initialize();
    const connectionHub = new ConnectionHub({ database: dataSource });
    repo = new VerificarPagamentoRepostiory(connectionHub);
    gateway = new VerificarPagamentoGateway(connectionHub);
  });
  afterAll(async () => {
    clock.restore();
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve alterar status do pagamento caso gateway identificar como pago", async () => {
    const pagamentoUuid = "407cb594-4574-4824-acc3-75a68ece3155";
    const cobrancaUuid = "407cb594-4574-4824-acc3-75a68ece3155";
    const contaBancariaUuid = "3fba0036-f55d-4cd1-a853-6d5f2bedf792";

    const verificaPagamentoStub = stub(gateway, "verificarPagamento").resolves({
      dataPagamento: "2026-06-18",
      dataCreditado: "2026-06-19",
      valorPago: 101.5,
    });

    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, banco_numero)
      VALUES ('${contaBancariaUuid}', '${companyUuid}', '461')`);
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid)
      VALUES ('${cobrancaUuid}', '${companyUuid}', '${companyUuid}')`);
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, valor, banco_ref)
      VALUES ('${pagamentoUuid}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'boleto', 100, '')`);

    const usecase = new VerificarPagamentoUsecase(repo, gateway);
    const input = {
      companyUuid,
      pagamentoUuid,
    };
    await usecase.execute(input);

    const [pagamentoModel] = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE uuid = '${pagamentoUuid}'`);
    expect(pagamentoModel.status).toBe("RECEIVED");
    expect(pagamentoModel.updated_at).toBe("2026-06-20");
    expect(pagamentoModel.pago_em).toBe("2026-06-18");
    expect(pagamentoModel.valor_pago).toBe(101.5);

    verificaPagamentoStub.restore();
  });
});
