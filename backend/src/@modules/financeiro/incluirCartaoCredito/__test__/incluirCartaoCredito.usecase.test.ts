import dataSource from "src/@infra/database/datasource";
import { stub } from "sinon";
import { IncluirCartaoCreditoGateway } from "../incluirCartaoCreditoGateway";
import { IncluirCartaoCreditoUsecase } from "../incluirCartaoCredito.usecase";
import { IncluirCartaoCreditoRepository } from "../incluirCartaoCreditoRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const companyUuid = "e64eaf60-fd30-49a5-b807-96d3b35b6bcf";
const userUuid = "97d71e21-b74f-4dd9-a979-e7387cecf9ec";
let repo: IncluirCartaoCreditoRepository;

describe("Deve testar IncluirCartaoCreditoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub({ database: dataSource });
    repo = new IncluirCartaoCreditoRepository(connectionHub);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_cartao_credito WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve incluir cartao para usuário", async () => {
    const contaBancariaUuid = "a1b2c3d4-e5f6-7890-1234-567890abcdef";

    const registrarCartaoStub = stub(IncluirCartaoCreditoGateway.prototype, "registrarCartao").resolves({
      numeroCartao: "numeroCartao",
      bandeira: "bandeira",
      token: "token",
    });

    await dataSource.query(`INSERT INTO auth_users (uuid, name, email, phone, cep, endereco, endereco_numero, bairro, cidade, uf)
      VALUES ('${userUuid}', 'usuarioNome', 'usuariEmail', '69984578458', '76962030', 'usuarioEndereco', 'Numero', 'Bairro', 'Cidade', 'UF')`);

    await dataSource.query(`INSERT INTO financeiro_contas_bancarias (uuid, company_uuid, banco_numero, chave_api, ambiente)
      VALUES ('${contaBancariaUuid}', '${companyUuid}', '461', 'ChaveDeApi', 'HOMOLOG')`);

    const usecase = new IncluirCartaoCreditoUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      cartaoCredito: {
        nomeNoCartao: "nomeNoCartao",
        numeroCartao: "numeroCartao",
        mesVencimento: "mesVencimento",
        anoVencimento: "anoVencimento",
        codigoSeguranca: "codigoSeguranca",
      },
    };
    await usecase.execute(input);

    const [cartaoModel] = await dataSource.query(`SELECT * FROM financeiro_cartao_credito WHERE company_uuid = '${companyUuid}'`);
    expect(cartaoModel.user_uuid).toBe(userUuid);
    expect(cartaoModel.conta_bancaria_uuid).toBe(contaBancariaUuid);
    expect(cartaoModel.numero).toBe("numeroCartao");
    expect(cartaoModel.bandeira).toBe("bandeira");
    expect(cartaoModel.token).toBe("token");

    registrarCartaoStub.restore();
  });
});
