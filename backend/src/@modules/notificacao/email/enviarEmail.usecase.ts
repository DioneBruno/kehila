import { EnviarEmailRepository } from "./enviarEmailRepository";
import { MensagemEntity } from "./mensagem.entity";

export type EnviarEmailInput = {
  companyUuid: string;
  gateway: string;
  destinatario: string;
  titulo: string;
  mensagem: string;
  nomeAmigavel?: string;
};

export class EnviarEmailUsecase {
  constructor(readonly repo: EnviarEmailRepository) {}

  async execute(input: EnviarEmailInput) {
    const mensagem = new MensagemEntity({
      companyUuid: input.companyUuid,
      gateway: input.gateway,
      destinatario: input.destinatario,
      titulo: input.titulo,
      mensagem: input.mensagem,
      nomeAmigavel: input.nomeAmigavel,
    });
    const gateway = await this.repo.buscarGatewaty(mensagem);
    await gateway.enviar(mensagem);
  }
}
