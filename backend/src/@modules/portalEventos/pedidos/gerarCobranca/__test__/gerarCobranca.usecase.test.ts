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
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lote_tipos_ingresso WHERE company_uuid = '${companyUuid}'`);
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM auth_users WHERE uuid = '${userUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_pedidos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_ingressos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM evento_lote_tipos_ingresso WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
  });

  test("Deve chamar FinanceiroGerarCobrancaUsecase com dados do usuário", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    const tipoIngressoUuid = "82b3750-56cc-46ae-8961-74e2614e03d2";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
      VALUES ('1${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 100)`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 300)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "usuarioLogado" as const,
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(1);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(300);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoPedido");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(pedidoUuid);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("nomeUsuario");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("cpfUsuario");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("emailUsuario");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("telefoneUsuario");

    gerarCobrancaStub.restore();
  });

  test("Deve alterar status do pedido para pagamento_gerado", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    const tipoIngressoUuid = "82b3750-56cc-46ae-8961-74e2614e03d2";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
      VALUES ('1${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 100)`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 300)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "usuarioLogado" as const,
    };
    await usecase.execute(input);

    const [pedidoModel] = await dataSource.query(`SELECT * FROM evento_pedidos WHERE uuid = '${pedidoUuid}'`);
    expect(pedidoModel.status).toBe("pagamento_gerado");

    gerarCobrancaStub.restore();
  });

  test("Deve chamar FinanceiroGerarCobrancaUsecase com dados informador no input - pagadorAvulso", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    const tipoIngressoUuid = "82b3750-56cc-46ae-8961-74e2614e03d2";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
      VALUES ('1${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 100)`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 300)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "avulso" as const,
      pagadorNome: "pagadorNome",
      pagadorDocumento: "pagadorDocumento",
      pagadorEmail: "pagadorEmail",
      pagadorTelefone: "pagadorTelefone",
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(1);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(300);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoPedido");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(pedidoUuid);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("pagadorNome");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("pagadorDocumento");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("pagadorEmail");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("pagadorTelefone");

    gerarCobrancaStub.restore();
  });

  test("Deve chamar FinanceiroGerarCobrancaUsecase com parcelamento boleto e dados de cada ingresso", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    const tipoIngressoUuid = "82b3750-56cc-46ae-8961-74e2614e03d2";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
      VALUES ('1${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 100)`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 300, 300)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "ingresso" as const,
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(3);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(100);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(`1${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("pessoa1");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("11111111111");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("email Pessoa1");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("telefone Pessoa1");

    expect(gerarCobrancaStub.args[1][0].valor).toBe(100);
    expect(gerarCobrancaStub.args[1][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[1][0].origemUuid).toBe(`2${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[1][0].pagadorNome).toBe("pessoa2");
    expect(gerarCobrancaStub.args[1][0].pagadorDocumento).toBe("22222222222");
    expect(gerarCobrancaStub.args[1][0].pagadorEmail).toBe("email Pessoa2");
    expect(gerarCobrancaStub.args[1][0].pagadorTelefone).toBe("telefone Pessoa2");

    expect(gerarCobrancaStub.args[2][0].valor).toBe(100);
    expect(gerarCobrancaStub.args[2][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[2][0].origemUuid).toBe(`3${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[2][0].pagadorNome).toBe("pessoa3");
    expect(gerarCobrancaStub.args[2][0].pagadorDocumento).toBe("33333333333");
    expect(gerarCobrancaStub.args[2][0].pagadorEmail).toBe("email Pessoa3");
    expect(gerarCobrancaStub.args[2][0].pagadorTelefone).toBe("telefone Pessoa3");

    gerarCobrancaStub.restore();
  });

  test("Deve verificar o valor do tipo de ingresso para cada participante", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    const tipoIngressoUuid = "82b3750-56cc-46ae-8961-74e2614e03d2";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
      VALUES ('1${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 125),
      ('2${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 50)`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 300, 300)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '2${tipoIngressoUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "ingresso" as const,
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(3);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(125);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(`1${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("pessoa1");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("11111111111");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("email Pessoa1");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("telefone Pessoa1");

    expect(gerarCobrancaStub.args[1][0].valor).toBe(125);
    expect(gerarCobrancaStub.args[1][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[1][0].origemUuid).toBe(`2${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[1][0].pagadorNome).toBe("pessoa2");
    expect(gerarCobrancaStub.args[1][0].pagadorDocumento).toBe("22222222222");
    expect(gerarCobrancaStub.args[1][0].pagadorEmail).toBe("email Pessoa2");
    expect(gerarCobrancaStub.args[1][0].pagadorTelefone).toBe("telefone Pessoa2");

    expect(gerarCobrancaStub.args[2][0].valor).toBe(50);
    expect(gerarCobrancaStub.args[2][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[2][0].origemUuid).toBe(`3${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[2][0].pagadorNome).toBe("pessoa3");
    expect(gerarCobrancaStub.args[2][0].pagadorDocumento).toBe("33333333333");
    expect(gerarCobrancaStub.args[2][0].pagadorEmail).toBe("email Pessoa3");
    expect(gerarCobrancaStub.args[2][0].pagadorTelefone).toBe("telefone Pessoa3");

    gerarCobrancaStub.restore();
  });

  test("Deve gerar cobrança apenas para tipo ingresso com valor maior que 0", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    const tipoIngressoUuid = "82b3750-56cc-46ae-8961-74e2614e03d2";
    await dataSource.query(`INSERT INTO evento_lote_tipos_ingresso (uuid, company_uuid, evento_uuid, lote_uuid, nome, preco)
      VALUES ('1${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 1', 150),
      ('2${tipoIngressoUuid}', '${companyUuid}', '${companyUuid}', '${companyUuid}', 'Lote 2', 0)`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 300, 300)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '1${tipoIngressoUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '2${tipoIngressoUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "ingresso" as const,
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(3);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(125);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(`1${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[0][0].pagadorNome).toBe("pessoa1");
    expect(gerarCobrancaStub.args[0][0].pagadorDocumento).toBe("11111111111");
    expect(gerarCobrancaStub.args[0][0].pagadorEmail).toBe("email Pessoa1");
    expect(gerarCobrancaStub.args[0][0].pagadorTelefone).toBe("telefone Pessoa1");

    expect(gerarCobrancaStub.args[1][0].valor).toBe(125);
    expect(gerarCobrancaStub.args[1][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[1][0].origemUuid).toBe(`2${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[1][0].pagadorNome).toBe("pessoa2");
    expect(gerarCobrancaStub.args[1][0].pagadorDocumento).toBe("22222222222");
    expect(gerarCobrancaStub.args[1][0].pagadorEmail).toBe("email Pessoa2");
    expect(gerarCobrancaStub.args[1][0].pagadorTelefone).toBe("telefone Pessoa2");

    expect(gerarCobrancaStub.args[2][0].valor).toBe(50);
    expect(gerarCobrancaStub.args[2][0].origem).toBe("eventoIngresso");
    expect(gerarCobrancaStub.args[2][0].origemUuid).toBe(`3${ingressoUuidBase}`);
    expect(gerarCobrancaStub.args[2][0].pagadorNome).toBe("pessoa3");
    expect(gerarCobrancaStub.args[2][0].pagadorDocumento).toBe("33333333333");
    expect(gerarCobrancaStub.args[2][0].pagadorEmail).toBe("email Pessoa3");
    expect(gerarCobrancaStub.args[2][0].pagadorTelefone).toBe("telefone Pessoa3");

    gerarCobrancaStub.restore();
  });

  test("Deve chamar FinanceiroGerarCobrancaUsecase tipo pagamento cartaoCredito", async () => {
    const pedidoUuid = "86c3ee08-ed3c-4c57-97d2-a8e0aa61581c";

    const gerarCobrancaStub = stub(FinanceiroGerarCobrancaUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, cpf, email, phone )
      VALUES ('${userUuid}', 'nomeUsuario', 'cpfUsuario', 'emailUsuario', 'telefoneUsuario')`);

    await dataSource.query(`INSERT INTO evento_pedidos (uuid, company_uuid, user_uuid, evento_uuid, idempotency_key, valor_bruto, valor_liquido)
      VALUES ('${pedidoUuid}', '${companyUuid}', '${userUuid}', '${companyUuid}', '123e4567', 500, 1000)`);

    const ingressoUuidBase = "7a55d33-8c90-4836-a4f8-4b9a69f0a2d5";
    await dataSource.query(`INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo, pessoa_nome, pessoa_email, pessoa_telefone, pessoa_documento, pessoa_uf, pessoa_cidade)
      VALUES ('1${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '${companyUuid}', '${pedidoUuid}', '11111111', 'pessoa1', 'email Pessoa1', 'telefone Pessoa1', '11111111111', '11', 'cidade Pessoa1'),
      ('2${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '${companyUuid}', '${pedidoUuid}', '22222222', 'pessoa2', 'email Pessoa2', 'telefone Pessoa2', '22222222222', '22', 'cidade Pessoa2'),
      ('3${ingressoUuidBase}', '${companyUuid}', '${companyUuid}', '${companyUuid}', '${pedidoUuid}', '33333333', 'pessoa3', 'email Pessoa3', 'telefone Pessoa3', '33333333333', '33', 'cidade Pessoa3')`);

    const usecase = new GerarCobrancaUsecase(repo);
    const input = {
      companyUuid,
      userUuid,
      pedidoUuid,
      tipoPagador: "usuarioLogado" as const,
      tipoCobranca: "cartaoCredito" as const,
      cartaoUuid: "8eaa5057-f6d4-4bc1-b72f-5a0a633fc30a",
    };
    await usecase.execute(input);

    expect(gerarCobrancaStub.callCount).toBe(1);
    expect(gerarCobrancaStub.args[0][0].valor).toBe(1000);
    expect(gerarCobrancaStub.args[0][0].origem).toBe("eventoPedido");
    expect(gerarCobrancaStub.args[0][0].origemUuid).toBe(pedidoUuid);
    expect(gerarCobrancaStub.args[0][0].tipoCobranca).toBe("cartaoCredito");
    expect(gerarCobrancaStub.args[0][0].cartaoUuid).toBe("8eaa5057-f6d4-4bc1-b72f-5a0a633fc30a");

    gerarCobrancaStub.restore();
  });
});
