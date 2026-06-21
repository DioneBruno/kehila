import dataSource from "src/@infra/database/datasource";
import { CartaoEntity } from "../cartao.entity";
import { UsuarioEntity } from "../usuario.entity";
import { ContaBancariaEntity } from "../contabancaria.entity";
import { IncluirCartaoCreditoGatewayAsaas } from "../incluirCartaoCreditoGateway.asaas";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { randomUUID } from "crypto";
import axios from "axios";

const companyUuid = "b55b6fd5-8621-4f15-8d7d-bee07ea7e8c3";
let gateway: IncluirCartaoCreditoGatewayAsaas;

describe("Deve testar IncluirCartaoGatewayAsaas", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const http = axios.create({ baseURL: "https://api-sandbox.asaas.com" });
    const connectionHub = new ConnectionHub({ database: dataSource, http });
    gateway = new IncluirCartaoCreditoGatewayAsaas(connectionHub);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test.skip("Deve tokenizar cartao real no asaas (integração)", async () => {
    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, chave_api, status)
    VALUES ('${randomUUID()}', '${companyUuid}', 'FINANCEIRO_CHAVE_API', 'ativo')`);

    const cartaoCredito = new CartaoEntity({
      companyUuid,
      remoteIp: "127.0.0.1",
      usuario: new UsuarioEntity({
        uuid: "",
        nome: "",
        email: "",
        cpf: "",
        cep: "",
        endereco: "",
        enderecoNumero: "",
        bairro: "",
        cidade: "",
        uf: "",
        telefone: "",
      }),
      contaBancaria: new ContaBancariaEntity({
        uuid: "",
        bancoNumero: "",
        ambiente: "HOMOLOG",
      }),
      nome: "",
      numero: "",
      mesVencimento: "",
      anoVencimento: "",
      codigoSeguranca: "",
    });

    const response = await gateway.registrarCartao(cartaoCredito);
    console.log(response);
  });
});
