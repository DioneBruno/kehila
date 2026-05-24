export type PagadorProps = {
  documento: string;
  nome: string;
  email: string;
  telefone: string;
};

export class PagadorEntity {
  constructor(readonly props: PagadorProps) {}

  documento(): string {
    return this.props.documento;
  }
  nome(): string {
    return this.props.nome;
  }
  email(): string {
    return this.props.email;
  }
  telefone(): string {
    return this.props.telefone;
  }
}
