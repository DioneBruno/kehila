import * as sinon from "sinon";
import { EnviarEmailUsecase } from "../enviarEmail.usecase";
import { EnviarEmailRepository } from "../enviarEmailRepository";
import { EnviarEmailGatewaySmtp } from "../enviarEmailGateway.smtp";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "../mensagem.entity";
import * as nodemailer from "nodemailer";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

describe("Deve testar EnviarEmailUsecase", () => {
  beforeEach(() => {});

  afterEach(() => {
    sinon.restore();
    jest.clearAllMocks();
  });

  test("Deve chamar o método enviar do gateway SMTP com os dados corretos", async () => {
    const testUser = "sinagoga@exemplo.com";
    process.env.NOTIFICACAO_SMTP_USER = testUser;

    const sendMailMock = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });

    const connectionHub = new ConnectionHub({});
    const repo = new EnviarEmailRepository(connectionHub);
    const usecase = new EnviarEmailUsecase(repo);

    const input = {
      gateway: "smtp",
      destinatario: "usuario@exemplo.com",
      titulo: "Código de validação",
      mensagem: "Seu código é 123456",
    };

    await usecase.execute(input);

    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const enviado = sendMailMock.mock.calls[0][0];
    expect(enviado.from).toBe(testUser);
    expect(enviado.to).toBe(input.destinatario);
    expect(enviado.subject).toBe(input.titulo);
    expect(enviado.html).toBe(input.mensagem);
    expect(enviado.attachments).toEqual([]);
    expect(enviado.headers).toEqual({});

    delete process.env.NOTIFICACAO_SMTP_USER;
  });

  test("Deve chamar o método enviar do gateway SMTP com nome amigavel", async () => {
    const testUser = "sinagoga@exemplo.com";
    process.env.NOTIFICACAO_SMTP_USER = testUser;

    const sendMailMock = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });

    const connectionHub = new ConnectionHub({});
    const repo = new EnviarEmailRepository(connectionHub);
    const usecase = new EnviarEmailUsecase(repo);

    const input = {
      gateway: "smtp",
      nomeAmigavel: "Nome da Sinagoga",
      destinatario: "usuario@exemplo.com",
      titulo: "Código de validação",
      mensagem: "Seu código é 123456",
    };

    await usecase.execute(input);

    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const enviado = sendMailMock.mock.calls[0][0];
    expect(enviado.from).toBe(`"Nome da Sinagoga" <${testUser}>`);
    expect(enviado.to).toBe(input.destinatario);
    expect(enviado.subject).toBe(input.titulo);
    expect(enviado.html).toBe(input.mensagem);
    expect(enviado.attachments).toEqual([]);
    expect(enviado.headers).toEqual({});

    delete process.env.NOTIFICACAO_SMTP_USER;
  });

  test("Deve chamar o gateway SMTP com os dados corretos", async () => {
    const enviarStub = sinon.stub(EnviarEmailGatewaySmtp.prototype, "enviar").resolves();

    const connectionHub = new ConnectionHub({});
    const repo = new EnviarEmailRepository(connectionHub);
    const usecase = new EnviarEmailUsecase(repo);

    const input = {
      gateway: "smtp",
      destinatario: "usuario@exemplo.com",
      titulo: "Código de validação",
      mensagem: "Seu código é 123456",
    };

    await usecase.execute(input);

    expect(enviarStub.calledOnce).toBe(true);

    const mensagem: MensagemEntity = enviarStub.firstCall.args[0];
    expect(mensagem.destinatario()).toBe(input.destinatario);
    expect(mensagem.titulo()).toBe(input.titulo);
    expect(mensagem.mensagem()).toBe(input.mensagem);

    enviarStub.restore();
  });

  test("Deve chamar o gateway SMTP exatamente uma vez por envio", async () => {
    const enviarStub = sinon.stub(EnviarEmailGatewaySmtp.prototype, "enviar").resolves();

    const connectionHub = new ConnectionHub({});
    const repo = new EnviarEmailRepository(connectionHub);
    const usecase = new EnviarEmailUsecase(repo);

    await usecase.execute({
      gateway: "smtp",
      destinatario: "a@b.com",
      titulo: "Título",
      mensagem: "Mensagem",
    });

    await usecase.execute({
      gateway: "smtp",
      destinatario: "c@d.com",
      titulo: "Outro título",
      mensagem: "Outra mensagem",
    });

    expect(enviarStub.callCount).toBe(2);

    enviarStub.restore();
  });
});
