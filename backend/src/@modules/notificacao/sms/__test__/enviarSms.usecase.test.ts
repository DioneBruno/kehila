import * as sinon from "sinon";
import { EnviarSmsUsecase } from "../enviarSms.usecase";
import { EnviarSmsRepository } from "../enviarSmsRepository";
import { EnviarSmsGatewayVonage } from "../enviarSmsGateway.vonage";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "../mensagem.entity";

describe("Deve testar EnviarSmsUsecase", () => {
  let enviarStub: sinon.SinonStub;

  beforeEach(() => {
    enviarStub = sinon.stub(EnviarSmsGatewayVonage.prototype, "enviar").resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  test("Deve chamar o gateway Vonage com os dados corretos", async () => {
    const connectionHub = new ConnectionHub({});
    const repo = new EnviarSmsRepository(connectionHub);
    const usecase = new EnviarSmsUsecase(repo);

    const input = {
      gateway: "vonage",
      destinatario: "65985477589",
      mensagem: "Seu código de acesso é 123456",
    };

    await usecase.execute(input);

    expect(enviarStub.calledOnce).toBe(true);

    const mensagem: MensagemEntity = enviarStub.firstCall.args[0];
    expect(mensagem.destinatario()).toBe(input.destinatario);
    expect(mensagem.mensagem()).toBe(input.mensagem);
  });

  test("Deve chamar o gateway Vonage exatamente uma vez por envio", async () => {
    const connectionHub = new ConnectionHub({});
    const repo = new EnviarSmsRepository(connectionHub);
    const usecase = new EnviarSmsUsecase(repo);

    await usecase.execute({
      gateway: "vonage",
      destinatario: "65985477589",
      mensagem: "Mensagem um",
    });

    await usecase.execute({
      gateway: "vonage",
      destinatario: "69984852834",
      mensagem: "Mensagem dois",
    });

    expect(enviarStub.callCount).toBe(2);
  });
});
