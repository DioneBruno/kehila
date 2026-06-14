import * as sinon from "sinon";
import { EnviarEmailUsecase } from "../enviarEmail.usecase";
import { EnviarEmailRepository } from "../enviarEmailRepository";
import { EnviarEmailGatewaySmtp } from "../enviarEmailGateway.smtp";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "../mensagem.entity";

describe("Deve testar EnviarEmailUsecase", () => {
  let enviarStub: sinon.SinonStub;

  beforeEach(() => {
    enviarStub = sinon.stub(EnviarEmailGatewaySmtp.prototype, "enviar").resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  test("Deve chamar o gateway SMTP com os dados corretos", async () => {
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
  });

  test("Deve chamar o gateway SMTP exatamente uma vez por envio", async () => {
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
  });
});
