import dataSource from "src/@infra/database/datasource";
import type { AxiosInstance } from "axios";
import { CartaoEntity } from "../cartao.entity";
import { UsuarioEntity } from "../usuario.entity";
import { ContaBancariaEntity } from "../contabancaria.entity";
import { IncluirCartaoCreditoGatewayAsaas } from "../incluirCartaoCreditoGateway.asaas";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { randomUUID } from "crypto";

const companyUuid = "b55b6fd5-8621-4f15-8d7d-bee07ea7e8c3";

const buildCartaoCredito = (cpf: string = "88247744317") =>
  new CartaoEntity({
    companyUuid,
    remoteIp: "200.150.10.20",
    usuario: new UsuarioEntity({
      uuid: randomUUID(),
      nome: "Usuario Teste",
      email: "usuario@teste.com",
      cpf,
      cep: "76962030",
      endereco: "Rua Teste",
      enderecoNumero: "123",
      bairro: "Bairro Teste",
      cidade: "Cidade Teste",
      uf: "MT",
      telefone: "65985455877",
    }),
    contaBancaria: new ContaBancariaEntity({ uuid: randomUUID(), bancoNumero: "461", ambiente: "HOMOLOG" }),
    nome: "Usuario Teste",
    numero: "4444333322221111",
    mesVencimento: "06",
    anoVencimento: "2030",
    codigoSeguranca: "123",
  });

describe("Deve testar IncluirCartaoCreditoGatewayAsaas", () => {
  let httpGet: jest.Mock;
  let httpPost: jest.Mock;
  let gateway: IncluirCartaoCreditoGatewayAsaas;

  beforeAll(async () => {
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);

    httpGet = jest.fn();
    httpPost = jest.fn();
    const http = { get: httpGet, post: httpPost } as unknown as AxiosInstance;
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    gateway = new IncluirCartaoCreditoGatewayAsaas(connectionHub);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve tokenizar o cartão quando o cliente já existe no Asaas", async () => {
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, chave_api, status)
      VALUES ('${randomUUID()}', '${companyUuid}', 'CHAVE_TESTE', 'ativo')`);

    httpGet.mockResolvedValue({ data: { data: [{ id: "cus_existente" }] } });
    httpPost.mockResolvedValue({ data: { creditCardNumber: "8829", creditCardBrand: "MASTERCARD", creditCardToken: "tok_abc123" } });

    const response = await gateway.registrarCartao(buildCartaoCredito());

    expect(response).toEqual({ numeroCartao: "8829", bandeira: "MASTERCARD", token: "tok_abc123" });

    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(httpGet.mock.calls[0][0]).toContain("v3/customers?cpfCnpj=88247744317");
    expect(httpGet.mock.calls[0][1].headers.access_token).toBe("CHAVE_TESTE");

    expect(httpPost).toHaveBeenCalledTimes(1);
    const [url, body, config] = httpPost.mock.calls[0];
    expect(url).toContain("v3/creditCard/tokenizeCreditCard");
    expect(config.headers.access_token).toBe("CHAVE_TESTE");
    expect(body.customer).toBe("cus_existente");
    expect(body.creditCard).toEqual({
      holderName: "Usuario Teste",
      number: "4444333322221111",
      expiryMonth: "06",
      expiryYear: "2030",
      ccv: "123",
    });
    expect(body.creditCardHolderInfo).toEqual({
      name: "Usuario Teste",
      email: "usuario@teste.com",
      cpfCnpj: "88247744317",
      postalCode: "76962030",
      addressNumber: "123",
      phone: "65985455877",
    });
    expect(body.remoteIp).toBe("200.150.10.20");
  });

  test("Deve cadastrar o cliente no Asaas quando ele não existir e então tokenizar o cartão", async () => {
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, chave_api, status)
      VALUES ('${randomUUID()}', '${companyUuid}', 'CHAVE_TESTE', 'ativo')`);

    let chamadasGet = 0;
    httpGet.mockImplementation(() => {
      chamadasGet++;
      if (chamadasGet === 1) return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { data: [{ id: "cus_novo" }] } });
    });
    httpPost.mockImplementation((url: string) => {
      if (url.includes("v3/customers")) return Promise.resolve({ data: {} });
      return Promise.resolve({ data: { creditCardNumber: "1234", creditCardBrand: "VISA", creditCardToken: "tok_novo" } });
    });

    const response = await gateway.registrarCartao(buildCartaoCredito("11122233344"));

    expect(httpGet).toHaveBeenCalledTimes(2);

    expect(httpPost).toHaveBeenCalledTimes(2);
    const [cadastroUrl, cadastroBody] = httpPost.mock.calls[0];
    expect(cadastroUrl).toContain("v3/customers");
    expect(cadastroBody).toEqual({
      name: "Usuario Teste",
      cpfCnpj: "11122233344",
      email: "usuario@teste.com",
      phone: "65985455877",
      notificationDisabled: true,
    });

    const [tokenizeUrl, tokenizeBody] = httpPost.mock.calls[1];
    expect(tokenizeUrl).toContain("v3/creditCard/tokenizeCreditCard");
    expect(tokenizeBody.customer).toBe("cus_novo");

    expect(response).toEqual({ numeroCartao: "1234", bandeira: "VISA", token: "tok_novo" });
  });

  test("Deve utilizar a URL de produção quando a conta bancária estiver configurada como PROD", async () => {
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, chave_api, ambiente, status)
      VALUES ('${randomUUID()}', '${companyUuid}', 'CHAVE_PROD', 'PROD', 'ativo')`);

    httpGet.mockResolvedValue({ data: { data: [{ id: "cus_existente" }] } });
    httpPost.mockResolvedValue({ data: { creditCardNumber: "8829", creditCardBrand: "MASTERCARD", creditCardToken: "tok_abc123" } });

    await gateway.registrarCartao(buildCartaoCredito());

    expect(httpGet.mock.calls[0][0]).toContain("https://api.asaas.com");
    expect(httpPost.mock.calls[0][0]).toContain("https://api.asaas.com");
  });

  test("Deve lançar erro quando a conta bancária não for encontrada", async () => {
    await expect(gateway.registrarCartao(buildCartaoCredito())).rejects.toThrow("Conta bancária não encontrada");
    expect(httpGet).not.toHaveBeenCalled();
    expect(httpPost).not.toHaveBeenCalled();
  });
});
