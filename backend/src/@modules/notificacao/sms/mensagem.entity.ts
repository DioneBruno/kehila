export type MensagemProps = {
  gateway: { name: string };
  destinatario: string;
  mensagem: string;
};

export class MensagemEntity {
  constructor(readonly props: MensagemProps) {}

  gateway(): { name: string } {
    return this.props.gateway;
  }
  destinatario(): string {
    return this.props.destinatario;
  }
  mensagem(): string {
    return this.props.mensagem;
  }
}
