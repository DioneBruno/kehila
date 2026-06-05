export type IngressoProps = {
  uuid: string;
  pessoaNome: string;
  pessoaDocumento: string;
  pessoaEmail: string;
  pessoaTelefone: string;
};

export class IngressoEntity {
  constructor(readonly props: IngressoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  pessoaNome(): string {
    return this.props.pessoaNome;
  }
  pessoaDocumento(): string {
    return this.props.pessoaDocumento;
  }
  pessoaEmail(): string {
    return this.props.pessoaEmail;
  }
  pessoaTelefone(): string {
    return this.props.pessoaTelefone;
  }
}
