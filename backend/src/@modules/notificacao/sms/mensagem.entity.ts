export type MensagemProps = {
  gateway: { name: string };
  destinatario: string;
  mensagem: string;
};
//
export class MensagemEntity {
  constructor(readonly props: MensagemProps) {}

  gateway(): { name: string } {
    return this.props.gateway;
  }
  destinatario(): string {
    const numero = this.props.destinatario;
    return numero.startsWith("55") ? numero : `55${numero}`;
  }
  mensagem(): string {
    return this.props.mensagem;
  }
}
