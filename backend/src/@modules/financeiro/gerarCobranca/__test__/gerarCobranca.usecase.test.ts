import dataSource from "src/@infra/database/datasource";
import { stub } from "sinon";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { GerarCobrancaRepository } from "../gerarCobrancaRepository";
import { GerarCobrancaUsecase } from "../gerarCobranca.usecase";
import axios from "axios";

const companyUuid = "e4d4e1a7-53d4-4c25-9ebf-614c28bfb4e4";
const userUuid = "14433838-52a6-4802-9d79-13fbb2e447e0";
let repo: GerarCobrancaRepository;

describe("Deve testar GerarCobrancaUsecas", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios;
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    repo = new GerarCobrancaRepository(connectionHub);

    await dataSource.query(`INSERT INTO auth_users (uuid, name) VALUES ('${userUuid}', 'Nome');`);
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, status)
      VALUES ('${companyUuid}', '${companyUuid}', 'ativo');`);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cartao_credito WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cartao_credito WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
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
    const buscarGatewayStub = stub(repo, "buscarGateway").returns(gateway as any);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
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

  test("Deve incluir nova cobranca padrão - Boleto parcelada", async () => {
    const gateway = {
      gerarCobranca: () => {
        return {
          gatewayRef: "cobancaBancoRef",
          pagamentos: [
            {
              gatewayRef: "pagamentoBancoRef1",
              nossoNumero: "nossoNumero1",
              urlBoleto: "urlBoleto1",
              vancimento: "2026-06-10",
              codigoBarras: "codigoBarras1",
              linhaDigitavel: "linhaDigitavel1",
              pix: "pix1",
              valorCobranca: 100,
              valorComDescontoGateway: 99,
            },
            {
              gatewayRef: "pagamentoBancoRef2",
              nossoNumero: "nossoNumero2",
              urlBoleto: "urlBoleto2",
              vancimento: "2026-07-10",
              codigoBarras: "codigoBarras2",
              linhaDigitavel: "linhaDigitavel2",
              pix: "pix2",
              valorCobranca: 100,
              valorComDescontoGateway: 99,
            },
            {
              gatewayRef: "pagamentoBancoRef3",
              nossoNumero: "nossoNumero3",
              urlBoleto: "urlBoleto3",
              vancimento: "2026-08-10",
              codigoBarras: "codigoBarras3",
              linhaDigitavel: "linhaDigitavel3",
              pix: "pix3",
              valorCobranca: 100,
              valorComDescontoGateway: 99,
            },
          ],
        };
      },
    };
    const buscarGatewayStub = stub(repo, "buscarGateway").returns(gateway as any);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      origem: "origem",
      origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
      pagadorNome: "nome do pagador",
      pagadorDocumento: "12345678909",
      pagadorEmail: "email@dopagador.com",
      pagadorTelefone: "1199999999",
      valor: 300,
      numParcelas: 3,
      vencimento: "2026-06-10",
    };
    await usecase.execute(input);

    const cobrancaModel = await dataSource.query(`SELECT * FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    expect(cobrancaModel.length).toBe(1);
    expect(cobrancaModel[0].user_uuid).toBe(input.userUuid);
    expect(cobrancaModel[0].origem_tipo).toBe(input.origem);
    expect(cobrancaModel[0].origem_uuid).toBe(input.origemUuid);
    expect(cobrancaModel[0].banco_ref).toBe("cobancaBancoRef");
    expect(cobrancaModel[0].valor).toBe("300.00");
    expect(cobrancaModel[0].status).toBe("pendente");
    expect(cobrancaModel[0].pagador_nome).toBe("nome do pagador");
    expect(cobrancaModel[0].pagador_documento).toBe("12345678909");
    expect(cobrancaModel[0].pagador_email).toBe("email@dopagador.com");

    const pagamentosModel = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentosModel.length).toBe(3);
    expect(pagamentosModel[0].forma_pagamento).toBe("boleto");
    expect(pagamentosModel[0].banco_ref).toBe("pagamentoBancoRef1");
    expect(pagamentosModel[0].status).toBe("pendente");
    expect(pagamentosModel[0].vencimento).toBe("2026-06-10");
    expect(pagamentosModel[0].valor).toBe(100);
    expect(pagamentosModel[0].valor_com_desc_gateway).toBe(99);
    expect(pagamentosModel[0].status).toBe("pendente");
    expect(pagamentosModel[0].nosso_numero).toBe("nossoNumero1");
    expect(pagamentosModel[0].codigo_barras).toBe("codigoBarras1");
    expect(pagamentosModel[0].linha_digitavel).toBe("linhaDigitavel1");
    expect(pagamentosModel[0].pix).toBe("pix1");

    expect(pagamentosModel[1].forma_pagamento).toBe("boleto");
    expect(pagamentosModel[1].banco_ref).toBe("pagamentoBancoRef2");
    expect(pagamentosModel[1].status).toBe("pendente");
    expect(pagamentosModel[1].vencimento).toBe("2026-07-10");
    expect(pagamentosModel[1].valor).toBe(100);
    expect(pagamentosModel[1].valor_com_desc_gateway).toBe(99);
    expect(pagamentosModel[1].status).toBe("pendente");
    expect(pagamentosModel[1].nosso_numero).toBe("nossoNumero2");
    expect(pagamentosModel[1].codigo_barras).toBe("codigoBarras2");
    expect(pagamentosModel[1].linha_digitavel).toBe("linhaDigitavel2");
    expect(pagamentosModel[1].pix).toBe("pix2");

    expect(pagamentosModel[2].forma_pagamento).toBe("boleto");
    expect(pagamentosModel[2].banco_ref).toBe("pagamentoBancoRef3");
    expect(pagamentosModel[2].status).toBe("pendente");
    expect(pagamentosModel[2].vencimento).toBe("2026-08-10");
    expect(pagamentosModel[2].valor).toBe(100);
    expect(pagamentosModel[2].valor_com_desc_gateway).toBe(99);
    expect(pagamentosModel[2].status).toBe("pendente");
    expect(pagamentosModel[2].nosso_numero).toBe("nossoNumero3");
    expect(pagamentosModel[2].codigo_barras).toBe("codigoBarras3");
    expect(pagamentosModel[2].linha_digitavel).toBe("linhaDigitavel3");
    expect(pagamentosModel[2].pix).toBe("pix3");

    buscarGatewayStub.restore();
  });

  test("Pagamento com cartao - Deve verificar se usuário tem cartao cadastrado", async () => {
    const cartaoUuid = "8eaa5057-f6d4-4bc1-b72f-5a0a633fc30a";

    await dataSource.query(`INSERT INTO financeiro_cartao_credito (uuid, company_uuid, user_uuid, conta_bancaria_uuid)
      VALUES ('f096fa1c-3f71-4c2c-9c33-62f5df953d35', '${companyUuid}', '${userUuid}', '${companyUuid}');`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      origem: "origem",
      origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
      pagadorNome: "nome do pagador",
      pagadorDocumento: "12345678909",
      pagadorEmail: "email@dopagador.com",
      pagadorTelefone: "1199999999",
      valor: 154.36,
      vencimento: "2026-06-10",
      tipoCobranca: "cartaoCredito",
      cartaoUuid,
    };
    await expect(usecase.execute(input)).rejects.toThrow("Cartão não encontrado.");
  });
});
