import dataSource from "src/@infra/database/datasource";
import { useFakeTimers } from "sinon";
import { InformarPagamentoManualRepository } from "../informarPagamentoManualRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { InformarPagamentoManualUsecase } from "../informarPagamentoManual.usecase";
import { ApiDate } from "src/@modules/shared/apiDate";

const companyUuid = "19a3f1a5-2fbb-4fce-ae48-c5bdd15ba167";
let repo: InformarPagamentoManualRepository;
let connectionHub: ConnectionHub;
let clock: any;

describe("Deve testar InformarPagamentoManualUsecase", () => {
  beforeAll(async () => {
    clock = useFakeTimers({ now: new Date("2026-07-06 01:00:00"), toFake: ["Date"] });
    await dataSource.initialize();
    connectionHub = new ConnectionHub({ database: dataSource });
    repo = new InformarPagamentoManualRepository(connectionHub);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
    clock.restore();
  });

  test("Deve informar pagamento manual", async () => {
    const userUuid = "c5224d43-f8d4-46c8-9a5c-3760ccfe33a5";
    const cobrancaUuid = "cc6cd87e-f591-4ded-bca0-2d198dc96677";
    const pagamentoUuid = "7205bda9-89a0-48c2-baa8-82fa435a4b79";

    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_documento, pagador_email, pagador_telefone)
      VALUES ('${cobrancaUuid}', '${companyUuid}', '${companyUuid}', 'Pagador de teste 001', '88247744317', 'EMAIL_ADDRESS', '65985455877')`);
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, vencimento, valor)
      VALUES ('${pagamentoUuid}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'boleto', '2026-07-15', 145.78)`);

    const usecase = new InformarPagamentoManualUsecase(repo);
    const input = {
      userUuid,
      pagamentoUuid,
      valorPago: 145.78,
      pagoDescricao: "Descrição para o pagamento",
      pagoEm: "2026-06-25",
    };
    await usecase.execute(input);

    const [pagamentoModel] = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE uuid = '${pagamentoUuid}'`);
    expect(pagamentoModel.status).toBe("pago");
    expect(pagamentoModel.valor_pago).toBe("145.78");
    expect(ApiDate.format(pagamentoModel.pago_em)).toBe("2026-06-25 00:00:00");
    expect(pagamentoModel.forma_pagamento).toBe("manual");
    expect(ApiDate.format(pagamentoModel.pago_manual_data)).toBe("2026-07-06 01:00:00");
    expect(pagamentoModel.pago_manual_user_uuid).toBe(userUuid);
    expect(pagamentoModel.pago_manual_descricao).toBe("Descrição para o pagamento");
  });

  test("Valor pago não pode ser menor que valor cobrado", async () => {
    const userUuid = "c5224d43-f8d4-46c8-9a5c-3760ccfe33a5";
    const cobrancaUuid = "cc6cd87e-f591-4ded-bca0-2d198dc96677";
    const pagamentoUuid = "7205bda9-89a0-48c2-baa8-82fa435a4b79";

    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_documento, pagador_email, pagador_telefone)
      VALUES ('${cobrancaUuid}', '${companyUuid}', '${companyUuid}', 'Pagador de teste 001', '88247744317', 'EMAIL_ADDRESS', '65985455877')`);
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, vencimento, valor)
      VALUES ('${pagamentoUuid}', '${companyUuid}', '${companyUuid}', '${cobrancaUuid}', 'boleto', '2026-07-15', 145.78)`);

    const usecase = new InformarPagamentoManualUsecase(repo);
    const input = {
      userUuid,
      pagamentoUuid,
      valorPago: 145.0,
      pagoDescricao: "Descrição para o pagamento",
      pagoEm: "2026-06-25",
    };
    await expect(usecase.execute(input)).rejects.toThrow("Valor pago não pode ser menor que valor cobrado");
  });
});
