import dataSource from "src/@infra/database/datasource";
import { FecharPedidoUsecase } from "../fecharPedido.usecase";
import { FecharPedidoRepository } from "../fecharPedidoRepository";
import { ConnectionHub } from "src/@modules/shared/connectionHub";

const companyUuid = "7a0bc611-61f3-400f-8da4-f22b8a2f9e1d";
const userUuid = "c229e263-83bb-44c5-a6ca-6e16f0de6853";
let repo: FecharPedidoRepository;

describe("Deve testar FecharPedidoUsecase", () => {
  beforeAll(async () => {
    await dataSource.initialize();
    const connectionHub = new ConnectionHub(dataSource);
    repo = new FecharPedidoRepository(connectionHub);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve criar financeiroCobranca com dados do usuário", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 1000)`);

    const usecase = new FecharPedidoUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
    };
    await usecase.execute(input);

    const cobrancaModel = await dataSource.query(`SELECT * FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    expect(cobrancaModel.length).toBe(1);
    expect(cobrancaModel[0].valor).toBe("1000.00");
    expect(cobrancaModel[0].pagador_nome).toBe("nomeUsuario");
    expect(cobrancaModel[0].pagador_documento).toBe("cpfUsuario");
    expect(cobrancaModel[0].pagador_email).toBe("emailUsuario");
    expect(cobrancaModel[0].pagador_telefone).toBe("telefoneUsuario");
  });
});
