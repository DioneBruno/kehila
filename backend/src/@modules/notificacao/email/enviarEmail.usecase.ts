import { EnviarEmailRepository } from "./enviarEmailRepository";
import { MensagemEntity } from "./mensagem.entity";

export type EnviarEmailInput = {
  gateway: string;
  destinatario: string;
  titulo: string;
  mensagem: string;
};

export class EnviarEmailUsecase {
  constructor(readonly repo: EnviarEmailRepository) {}

  async execute(input: EnviarEmailInput) {
    const mensagem = new MensagemEntity({
      gateway: input.gateway,
      destinatario: input.destinatario,
      titulo: input.titulo,
      mensagem: input.mensagem,
    });
    const gateway = await this.repo.buscarGatewaty(mensagem);
    await gateway.enviar(mensagem);
  }
}
