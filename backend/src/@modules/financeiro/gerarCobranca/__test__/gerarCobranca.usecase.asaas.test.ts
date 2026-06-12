import dataSource from "src/@infra/database/datasource";
import { stub, SinonStub } from "sinon";
import { GerarCobrancaUsecase } from "../gerarCobranca.usecase";
import { GerarCobrancaRepository } from "../gerarCobrancaRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import axios from "axios";

const companyUuid = "e8d34640-f273-4d62-8b06-5bb19d6169ad";
let repo: GerarCobrancaRepository;

const defaultInput = {
  companyUuid,
  userUuid: "f3c16fee-6691-460c-a870-e160c1921580",
  origem: "origem",
  origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
  pagadorNome: "Pagador de teste 001",
  pagadorDocumento: "88247744317",
  pagadorEmail: "emailpagador@gmail.com",
  pagadorTelefone: "65985455877",
  valor: 154.36,
  vencimento: "2026-07-12",
};

describe("Deve testar GerarCobrancaUsecase com Gateway Asaas", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios.create({ baseURL: "https://api-sandbox.asaas.com" });
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    repo = new GerarCobrancaRepository(connectionHub);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test.skip("Deve criar cobranca real no asaas (integração)", async () => {
    await new GerarCobrancaUsecase(repo).execute(defaultInput);
  });

  test("Deve buscar cliente existente e criar cobrança", async () => {
    const clienteId = "cus_000005113026";
    const installmentId = "ins_000001234567";
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
    const postStub = stub(http, "post").resolves({ data: { installment: installmentId } });

    await new GerarCobrancaUsecase(repo).execute(defaultInput);

    // Verifica GET clientes com CPF/CNPJ correto
    expect(getStub.firstCall.args[0]).toContain("v3/customers");
    expect(getStub.firstCall.args[0]).toContain(defaultInput.pagadorDocumento);

    // Verifica POST payments com dados corretos
    expect(postStub.calledOnce).toBe(true);
    expect(postStub.firstCall.args[0]).toContain("v3/payments");
    const bodyCobranca = postStub.firstCall.args[1] as any;
    expect(bodyCobranca.customer).toBe(clienteId);
    expect(bodyCobranca.value).toBe(defaultInput.valor);
    expect(bodyCobranca.billingType).toBe("BOLETO");
    expect(bodyCobranca.installmentCount).toBe(1);

    // Verifica GET parcelas com installment ID correto
    expect(getStub.secondCall.args[0]).toContain(`v3/installments/${installmentId}/payments`);

    // Verifica dados salvos no banco
    const cobrancas = await dataSource.query(`SELECT * FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    expect(cobrancas.length).toBe(1);
    expect(cobrancas[0].banco_ref).toBe(installmentId);
    expect(cobrancas[0].valor).toBe("154.36");
    expect(cobrancas[0].status).toBe("pendente");

    const pagamentos = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentos.length).toBe(1);
    expect(pagamentos[0].banco_ref).toBe("pay_000001");
    expect(pagamentos[0].nosso_numero).toBe("123456");
    expect(pagamentos[0].pix).toBe("pix-code");
    expect(pagamentos[0].link_boleto).toBe("https://boleto.url");
    expect(pagamentos[0].valor).toBe(154.36);
    expect(pagamentos[0].valor_com_desc_gateway).toBe(152.0);

    getStub.restore();
    postStub.restore();
  });

  test("Deve cadastrar novo cliente no Asaas quando não existir", async () => {
    const clienteId = "cus_000005113026";
    const installmentId = "ins_000001234567";
    const http = repo.connectionHub.http as any;
    let getClienteCount = 0;

    const getStub: SinonStub = stub(http, "get");
    getStub.callsFake((url: string) => {
      if (url.includes("v3/customers")) {
        getClienteCount++;
        // Primeira chamada: cliente não existe; segunda (após cadastro): retorna cliente
        if (getClienteCount === 1) return Promise.resolve({ data: { data: [] } });
        return Promise.resolve({ data: { data: [{ id: clienteId }] } });
      }
      return Promise.resolve({
        data: {
          data: [
            {
              id: "pay_000001",
              nossoNumero: "123456",
              bankSlipUrl: "url",
              dueDate: "2026-07-12",
              value: 154.36,
              netValue: 152.0,
              pixTransaction: null,
            },
          ],
        },
      });
    });
    const postStub: SinonStub = stub(http, "post");
    postStub.callsFake((url: string) => {
      if (url.includes("v3/customers")) return Promise.resolve({ data: {} });
      return Promise.resolve({ data: { installment: installmentId } });
    });

    await new GerarCobrancaUsecase(repo).execute(defaultInput);

    // Verifica que cliente foi cadastrado com dados corretos
    expect(postStub.firstCall.args[0]).toContain("v3/customers");
    const bodyCliente = postStub.firstCall.args[1] as any;
    expect(bodyCliente.name).toBe(defaultInput.pagadorNome);
    expect(bodyCliente.cpfCnpj).toBe(defaultInput.pagadorDocumento);
    expect(bodyCliente.email).toBe(defaultInput.pagadorEmail);
    expect(bodyCliente.phone).toBe(defaultInput.pagadorTelefone);

    // Verifica que cobrança foi criada com o cliente recém-cadastrado
    expect(postStub.secondCall.args[0]).toContain("v3/payments");
    const bodyCobranca = postStub.secondCall.args[1] as any;
    expect(bodyCobranca.customer).toBe(clienteId);

    // Verifica dados no banco
    const cobrancas = await dataSource.query(`SELECT * FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    expect(cobrancas.length).toBe(1);
    expect(cobrancas[0].banco_ref).toBe(installmentId);

    getStub.restore();
    postStub.restore();
  });

  test("Deve criar cobrança parcelada enviando installmentCount correto - boleto", async () => {
    const clienteId = "cus_000005113026";
    const installmentId = "ins_000001234567";
    const http = repo.connectionHub.http as any;

    const getStub: SinonStub = stub(http, "get").callsFake((url: string) => {
      if (url.includes("v3/customers")) return Promise.resolve({ data: { data: [{ id: clienteId }] } });
      return Promise.resolve({
        data: {
          data: [
            { id: "pay_001", nossoNumero: "001", bankSlipUrl: "url1", dueDate: "2026-07-12", value: 100, netValue: 99, pixTransaction: null },
            { id: "pay_002", nossoNumero: "002", bankSlipUrl: "url2", dueDate: "2026-08-12", value: 100, netValue: 99, pixTransaction: null },
            { id: "pay_003", nossoNumero: "003", bankSlipUrl: "url3", dueDate: "2026-09-12", value: 100, netValue: 99, pixTransaction: null },
          ],
        },
      });
    });
    const postStub = stub(http, "post").resolves({ data: { installment: installmentId } });

    await new GerarCobrancaUsecase(repo).execute({ ...defaultInput, valor: 300, numParcelas: 3 });

    // Verifica que installmentCount e totalValue foram enviados corretamente
    expect(postStub.firstCall.args[0]).toContain("v3/payments");
    const bodyCobranca = postStub.firstCall.args[1] as any;
    expect(postStub.firstCall.args[1].billingType).toBe("BOLETO");
    expect(postStub.firstCall.args[1].customer).toBe(clienteId);
    expect(postStub.firstCall.args[1].value).toBe(300);
    expect(postStub.firstCall.args[1].dueDate).toBe("2026-06-13");
    expect(postStub.firstCall.args[1].description).toBe("Breve descrição para a cobrança");
    expect(postStub.firstCall.args[1].installmentCount).toBe(3);
    expect(postStub.firstCall.args[1].totalValue).toBe(300);
    expect(bodyCobranca.installmentCount).toBe(3);
    expect(bodyCobranca.totalValue).toBe(300);

    // Verifica que 3 pagamentos foram salvos
    const pagamentos = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentos.length).toBe(3);
    expect(pagamentos[0].banco_ref).toBe("pay_001");
    expect(pagamentos[1].banco_ref).toBe("pay_002");
    expect(pagamentos[2].banco_ref).toBe("pay_003");

    getStub.restore();
    postStub.restore();
  });

  test("Deve criar cobrança parcelada enviando installmentCount correto - Cartáo de Credito", async () => {
    const clienteId = "cus_000005113026";
    const installmentId = "ins_000001234567";
    const http = repo.connectionHub.http as any;

    const getStub: SinonStub = stub(http, "get").callsFake((url: string) => {
      if (url.includes("v3/customers")) return Promise.resolve({ data: { data: [{ id: clienteId }] } });
      return Promise.resolve({
        data: {
          data: [{ id: "pay_001", nossoNumero: "001", bankSlipUrl: "url1", dueDate: "2026-07-12", value: 100, netValue: 99, pixTransaction: null }],
        },
      });
    });
    const postStub = stub(http, "post").resolves({ data: { installment: installmentId, invoiceUrl: "invoiceUrl", invoiceNumber: "invoiceNumber" } });

    const input = {
      companyUuid,
      userUuid: "f3c16fee-6691-460c-a870-e160c1921580",
      origem: "origem",
      origemUuid: "4355c2d0-b479-4c57-b6b2-b97ed086e467",
      tipoCobranca: "cartaoCredito",
      pagadorNome: "Pagador de teste 001",
      pagadorDocumento: "88247744317",
      pagadorEmail: "emailpagador@gmail.com",
      pagadorTelefone: "65985455877",
      valor: 300,
      numParcelas: 3,
      vencimento: "2026-07-12",
    };

    await new GerarCobrancaUsecase(repo).execute(input);

    // Verifica que installmentCount e totalValue foram enviados corretamente
    expect(postStub.firstCall.args[0]).toContain("v3/payments");
    const bodyCobranca = postStub.firstCall.args[1] as any;
    expect(postStub.firstCall.args[1].billingType).toBe("CREDIT_CARD");
    expect(postStub.firstCall.args[1].customer).toBe(clienteId);
    expect(postStub.firstCall.args[1].value).toBe(300);
    expect(postStub.firstCall.args[1].dueDate).toBe("2026-06-13");
    expect(postStub.firstCall.args[1].description).toBe("Breve descrição para a cobrança");
    expect(postStub.firstCall.args[1].installmentCount).toBe(3);
    expect(postStub.firstCall.args[1].totalValue).toBe(300);
    expect(bodyCobranca.installmentCount).toBe(3);
    expect(bodyCobranca.totalValue).toBe(300);

    // Verifica que 1 pagamentos foram salvos
    const pagamentos = await dataSource.query(`SELECT * FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentos.length).toBe(1);
    expect(pagamentos[0].banco_ref).toBe("pay_001");
    expect(pagamentos[0].forma_pagamento).toBe("cartaoCredito");
    expect(pagamentos[0].link_cartao).toBe("invoiceUrl");

    getStub.restore();
    postStub.restore();
  });
});
