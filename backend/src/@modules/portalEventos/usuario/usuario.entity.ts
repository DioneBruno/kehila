export type UsuarioProps = {
  uuid: string;
  companyUuid: string;
  cpf: string;
  nome: string;
};

export class UsuarioEntity {
  constructor(readonly props: UsuarioProps) {}

  uuid(): string {
    return this.props.uuid;
  }

  companyUuid(): string {
    return this.props.companyUuid;
  }
  cpf(): string {
    return this.props.cpf;
  }
  nome(): string {
    return this.props.nome;
  }
}
