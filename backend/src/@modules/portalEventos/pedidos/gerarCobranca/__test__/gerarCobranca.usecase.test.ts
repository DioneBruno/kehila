import dataSource from "src/@infra/database/datasource";
import { stub } from "sinon";
import { GerarCobrancaUsecase } from "../gerarCobranca.usecase";
import { GerarCobrancaUsecase as FinanceiroGerarCobrancaUsecase } from "src/@modules/financeiro/gerarCobranca/gerarCobranca.usecase";
import { GerarCobrancaRepository } from "../gerarCobrancaRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const companyUuid = "7a0bc611-61f3-400f-8da4-f22b8a2f9e1d";
const userUuid = "c229e263-83bb-44c5-a6ca-6e16f0de6853";
let repo: GerarCobrancaRepository;

describe("Deve testar GerarCobrancaUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub({ database: dataSource });
    repo = new GerarCobrancaRepository(connectionHub);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve criar financeiroCobranca com dados do usuário", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 1000)`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(1);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(1000);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoPedido");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(pedidoUuid);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("nomeUsuario");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("cpfUsuario");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("emailUsuario");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("telefoneUsuario");

    gerarCobrancaStub.restore();
  });

  test("Deve criar financeiroCobranca com dados informador no input - pagadorAvulso", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 1000)`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      pagadorAvulso: true,
      pagadorNome: "pagadorNome",
      pagadorDocumento: "pagadorDocumento",
      pagadorEmail: "pagadorEmail",
      pagadorTelefone: "pagadorTelefone",
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(1);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(1000);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoPedido");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(pedidoUuid);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("pagadorNome");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("pagadorDocumento");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("pagadorEmail");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("pagadorTelefone");

    gerarCobrancaStub.restore();
  });
});
