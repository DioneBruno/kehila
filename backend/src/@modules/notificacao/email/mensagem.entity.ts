export type MensagemProps = {
  gateway: string;
  destinatario: string;
  titulo: string;
  mensagem: string;
};

export class MensagemEntity {
  constructor(readonly props: MensagemProps) {}

  gateway(): string {
    return this.props.gateway;
  }
  destinatario(): string {
    return this.props.destinatario;
  }
  titulo(): string {
    return this.props.titulo;
  }
  mensagem(): string {
    return this.props.mensagem;
  }
}
