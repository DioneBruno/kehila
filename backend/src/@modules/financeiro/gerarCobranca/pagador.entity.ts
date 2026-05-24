export type PagadorProps = {
  documento: string;
  nome: string;
  email: string;
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
}
