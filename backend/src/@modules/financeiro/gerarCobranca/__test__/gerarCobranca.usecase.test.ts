import dataSource from "src/@infra/database/datasource";
import { stub } from "sinon";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { GerarCobrancaRepository } from "../gerarCobrancaRepository";
import { GerarCobrancaUsecase } from "../gerarCobranca.usecase";

const companyUuid = "e8d34640-f273-4d62-8b06-5bb19d6169ad";
let repo: GerarCobrancaRepository;

describe("Deve testar GerarCobrancaUsecas", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = {} as any;
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    repo = new GerarCobrancaRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve incluir nova cobranca padrão - Boleto uma parcela", async () => {
    const gateway = {
      gerarCobranca: () => {
        return {
          gatewayRef: "cobancaBancoRef",
          pagamentos: [
            {
              gatewayRef: "pagamentoBancoRef",
              nossoNumero: "nossoNumero",
              urlBoleto: "urlBoleto",
              vancimento: "2026-06-10",
              codigoBarras: "codigoBarras",
              linhaDigitavel: "linhaDigitavel",
              pix: "pix",
              valorCobranca: 154.36,
              valorComDescontoGateway: 144.36,
            },
          ],
        };
      },
    };
    const buscarGatewayStub = stub(repo, "buscarGateway").returns(gateway);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid: "f3c16fee-6691-460c-a870-e160c1921580",
      origem: "origem",
      origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
      pagadorNome: "nome do pagador",
      pagadorDocumento: "12345678909",
      pagadorEmail: "email@dopagador.com",
      pagadorTelefone: "1199999999",
      valor: 154.36,
      vencimento: "2026-06-10",
    };
    await usecase.execute(input);

    const cobrancaModel = await dataSource.query(`SELECT * FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    expect(cobrancaModel.length).toBe(1);
    expect(cobrancaModel[0].user_uuid).toBe(input.userUuid);
    expect(cobrancaModel[0].origem_tipo).toBe(input.origem);
    expect(cobrancaModel[0].origem_uuid).toBe(input.origemUuid);
    expect(cobrancaModel[0].banco_ref).toBe("cobancaBancoRef");
    expect(cobrancaModel[0].valor).toBe("154.36");
    expect(cobrancaModel[0].status).toBe("pendente");
    expect(cobrancaModel[0].pagador_nome).toBe("nome do pagador");
    expect(cobrancaModel[0].pagador_documento).toBe("12345678909");
    expect(cobrancaModel[0].pagador_email).toBe("email@dopagador.com");

    const pagamentosModel = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentosModel.length).toBe(1);
    expect(pagamentosModel[0].forma_pagamento).toBe("boleto");
    expect(pagamentosModel[0].banco_ref).toBe("pagamentoBancoRef");
    expect(pagamentosModel[0].status).toBe("pendente");
    expect(pagamentosModel[0].vencimento).toBe(input.vencimento);
    expect(pagamentosModel[0].valor).toBe(154.36);
    expect(pagamentosModel[0].valor_com_desc_gateway).toBe(144.36);
    expect(pagamentosModel[0].status).toBe("pendente");
    expect(pagamentosModel[0].nosso_numero).toBe("nossoNumero");
    expect(pagamentosModel[0].codigo_barras).toBe("codigoBarras");
    expect(pagamentosModel[0].linha_digitavel).toBe("linhaDigitavel");
    expect(pagamentosModel[0].pix).toBe("pix");

    buscarGatewayStub.restore();
  });
});
