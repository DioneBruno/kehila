import { EnviarSmsRepository } from "./enviarSmsRepository";
import { MensagemEntity } from "./mensagem.entity";

export type EnviarSmsInput = {
  gateway: string;
  destinatario: string;
  mensagem: string;
};

export class EnviarSmsUsecase {
  constructor(readonly repo: EnviarSmsRepository) {}

  async execute(input: EnviarSmsInput) {
    const mensagem = new MensagemEntity({
      gateway: { name: input.gateway },
      destinatario: input.destinatario,
      mensagem: input.mensagem,
    });
    const gateway = await this.repo.buscarGateway(mensagem);
    gateway.enviar(mensagem);
  }
}
