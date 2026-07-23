import dataSource from "src/@infra/database/datasource";
import { stub, useFakeTimers } from "sinon";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { NotificarVencimentoPagamentoUsecase } from "../notificarVencimentoPagamento.usecase";
import { NotificarVencimentoPagamentoRepository } from "../notificarVencimentoPagamentoRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ApiDate } from "src/@modules/shared/apiDate";
import { randomUUID } from "crypto";

const companyUuid = "385a0c0b-65e8-458f-868c-e390f5c2728d";
const nomeUser = "1e4f7acb51fa";
let repo: NotificarVencimentoPagamentoRepository;
let clock: sinon.SinonFakeTimers;

describe("Deve testar NotificarVencimentoPagamentoUsecase", () => {
  beforeAll(async () => {
    clock = useFakeTimers({ now: new Date("2024-06-20 01:22:30"), toFake: ["Date"] });
    await dataSource.initialize();
    const connections = new ConnectionHub({ database: dataSource });
    repo = new NotificarVencimentoPagamentoRepository(connections);
  });
  beforeEach(async () => {
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM auth_users WHERE name like '%${nomeUser}%'`);
    await dataSource.query(`DELETE FROM financeiro_pagamento_notificacoes WHERE company_uuid = '${companyUuid}'`);
  });
  afterAll(async () => {
    await dataSource.query(`DELETE FROM financeiro_pagamentos WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_cobrancas WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM financeiro_contas_bancarias WHERE company_uuid = '${companyUuid}'`);
    await dataSource.query(`DELETE FROM auth_users WHERE name like '%${nomeUser}%'`);
    await dataSource.query(`DELETE FROM financeiro_pagamento_notificacoes WHERE company_uuid = '${companyUuid}'`);
    await dataSource.destroy();
    clock.restore();
  });

  test("Deve enviar email para endereço informado em financeiro_cobrancas.pagador_email", async () => {
    const userUuid = "b4f3aa00-bccc-4a33-a779-7e4bc1096e95";

    const enviarEmailUsecase = stub(EnviarEmailUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ('${userUuid}', '${nomeUser}', 'emaildo@usuario.com.br')`);

    const cobrancaUuidBase = "b35e2d4-0118-4e04-a49f-aa55a30bdeea";
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_email)
      VALUES ('1${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com')`);

    const pagamentoUuidBase = "5e50b1e-f619-4375-bb81-10511778b55b";
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, valor, banco_ref, vencimento, link_boleto)
      VALUES ('1${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '1${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto')`);

    const usecase = new NotificarVencimentoPagamentoUsecase(repo);
    const input = { diasParaVencimento: 5 };
    await usecase.execute(input);

    // console.log(enviarEmailUsecase.args);
    expect(enviarEmailUsecase.callCount).toBe(1);
    expect(enviarEmailUsecase.args[0][0].companyUuid).toBe(companyUuid);
    expect(enviarEmailUsecase.args[0][0].destinatario).toBe("emaildoPagador@gmail.com");
    expect(enviarEmailUsecase.args[0][0].titulo).toBe("Aviso de Vencimento");
    expect(enviarEmailUsecase.args[0][0].mensagem).not.toBeNull();

    enviarEmailUsecase.restore();
  });

  test("Deve registrar o envio na tabela financeiro_pagamento_notificacoes", async () => {
    const userUuid = "b4f3aa00-bccc-4a33-a779-7e4bc1096e95";

    const enviarEmailUsecase = stub(EnviarEmailUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ('${userUuid}', '${nomeUser}', 'emaildo@usuario.com.br')`);

    const cobrancaUuidBase = "b35e2d4-0118-4e04-a49f-aa55a30bdeea";
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_email)
      VALUES ('1${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('2${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('3${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('4${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com')`);

    const pagamentoUuidBase = "5e50b1e-f619-4375-bb81-10511778b55b";
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, valor, banco_ref, vencimento, link_boleto)
      VALUES ('1${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '1${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('2${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '2${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('3${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '3${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('4${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '4${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto')`);

    const usecase = new NotificarVencimentoPagamentoUsecase(repo);
    const input = { diasParaVencimento: 5 };
    await usecase.execute(input);

    // console.log(enviarEmailUsecase.args);
    const pagamentoNotificacoes = await dataSource.query(`SELECT * FROM financeiro_pagamento_notificacoes WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentoNotificacoes.length).toBe(4);
    expect(pagamentoNotificacoes[0].company_uuid).toBe(companyUuid);
    expect(pagamentoNotificacoes[0].pagamento_uuid).toBe(`1${pagamentoUuidBase}`);
    expect(pagamentoNotificacoes[0].tipo).toBe("email");
    expect(ApiDate.format(pagamentoNotificacoes[0].data_envio)).toBe("2024-06-20 01:22:30");

    enviarEmailUsecase.restore();
  });

  test("Não deve enviar caso já tenha registro em financeiro_pagamento_notificacoes, para o pagamento", async () => {
    const userUuid = "b4f3aa00-bccc-4a33-a779-7e4bc1096e95";

    const enviarEmailUsecase = stub(EnviarEmailUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ('${userUuid}', '${nomeUser}', 'emaildo@usuario.com.br')`);

    const cobrancaUuidBase = "b35e2d4-0118-4e04-a49f-aa55a30bdeea";
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_email)
      VALUES ('1${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('2${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('3${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('4${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com')`);

    const pagamentoUuidBase = "5e50b1e-f619-4375-bb81-10511778b55b";
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, valor, banco_ref, vencimento, link_boleto)
      VALUES ('1${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '1${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('2${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '2${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('3${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '3${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('4${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '4${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto')`);

    await dataSource.query(`INSERT INTO financeiro_pagamento_notificacoes (uuid, company_uuid, pagamento_uuid, tipo, data_envio)
          VALUES ($1, $2, $3, $4, $5)`, [randomUUID(), companyUuid, `1${pagamentoUuidBase}`, "email", ApiDate.now()]);

    const usecase = new NotificarVencimentoPagamentoUsecase(repo);
    const input = { diasParaVencimento: 5 };
    await usecase.execute(input);

    expect(enviarEmailUsecase.callCount).toBe(3);
    const pagamentoNotificacoes = await dataSource.query(`SELECT * FROM financeiro_pagamento_notificacoes WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentoNotificacoes.length).toBe(4);

    enviarEmailUsecase.restore();
  });

  test("Deve forçar envio de pagamento mesmo com notificação", async () => {
    const userUuid = "b4f3aa00-bccc-4a33-a779-7e4bc1096e95";

    const enviarEmailUsecase = stub(EnviarEmailUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ('${userUuid}', '${nomeUser}', 'emaildo@usuario.com.br')`);

    const cobrancaUuidBase = "b35e2d4-0118-4e04-a49f-aa55a30bdeea";
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_email)
      VALUES ('1${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('2${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('3${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('4${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com')`);

    const pagamentoUuidBase = "5e50b1e-f619-4375-bb81-10511778b55b";
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, valor, banco_ref, vencimento, link_boleto)
      VALUES ('1${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '1${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('2${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '2${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('3${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '3${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('4${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '4${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto')`);

    await dataSource.query(`INSERT INTO financeiro_pagamento_notificacoes (uuid, company_uuid, pagamento_uuid, tipo, data_envio)
          VALUES ($1, $2, $3, $4, $5)`, [randomUUID(), companyUuid, `1${pagamentoUuidBase}`, "email", ApiDate.now()]);

    const usecase = new NotificarVencimentoPagamentoUsecase(repo);
    const input = { diasParaVencimento: 5, forcarEnvio: true };
    await usecase.execute(input);

    expect(enviarEmailUsecase.callCount).toBe(4);
    const pagamentoNotificacoes = await dataSource.query(`SELECT * FROM financeiro_pagamento_notificacoes WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentoNotificacoes.length).toBe(5);

    enviarEmailUsecase.restore();
  });

  test("Deve enviar para um array de uuids de pagamentos", async () => {
    const userUuid = "b4f3aa00-bccc-4a33-a779-7e4bc1096e95";

    const enviarEmailUsecase = stub(EnviarEmailUsecase.prototype, "execute").resolves();

    await dataSource.query(`INSERT INTO auth_users (uuid, name, email) VALUES ('${userUuid}', '${nomeUser}', 'emaildo@usuario.com.br')`);

    const cobrancaUuidBase = "b35e2d4-0118-4e04-a49f-aa55a30bdeea";
    await dataSource.query(`INSERT INTO financeiro_cobrancas (uuid, company_uuid, user_uuid, pagador_nome, pagador_email)
      VALUES ('1${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('2${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('3${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com'),
      ('4${cobrancaUuidBase}', '${companyUuid}', '${userUuid}', 'Nome do Pagador', 'emaildoPagador@gmail.com')`);

    const pagamentoUuidBase = "5e50b1e-f619-4375-bb81-10511778b55b";
    await dataSource.query(`INSERT INTO financeiro_pagamentos (uuid, company_uuid, user_uuid, cobanca_uuid, forma_pagamento, valor, banco_ref, vencimento, link_boleto)
      VALUES ('1${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '1${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('2${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '2${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('3${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '3${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto'),
      ('4${pagamentoUuidBase}', '${companyUuid}', '${companyUuid}', '4${cobrancaUuidBase}', 'boleto', 100, '', '2024-06-25', 'Link_do_boleto')`);

    const usecase = new NotificarVencimentoPagamentoUsecase(repo);
    const input = { pagamentosUuid: [`1${pagamentoUuidBase}`, `2${pagamentoUuidBase}`] };
    await usecase.execute(input);

    expect(enviarEmailUsecase.callCount).toBe(2);
    const pagamentoNotificacoes = await dataSource.query(`SELECT * FROM financeiro_pagamento_notificacoes WHERE company_uuid = '${companyUuid}'`);
    expect(pagamentoNotificacoes.length).toBe(2);

    enviarEmailUsecase.restore();
  });
});
