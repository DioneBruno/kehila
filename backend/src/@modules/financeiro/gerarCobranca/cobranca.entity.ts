export type CobrancaProps = {
  companyUuid: string;
  uuid: string;
  userUuid: string;
  pagadorNome: string;
  pagadorDocumento: string;
  pagadorEmail: string;
  pagadorTelefone: string;
  origem: string;
  origemUuid: string;
  valor: number;
};

export class CobrancaEntity {
  constructor(readonly props: CobrancaProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  userUuid(): string {
    return this.props.userUuid;
  }
  pagadorNome(): string {
    return this.props.pagadorNome;
  }
  pagadorDocumento(): string {
    return this.props.pagadorDocumento;
  }
  pagadorEmail(): string {
    return this.props.pagadorEmail;
  }
  pagadorTelefone(): string {
    return this.props.pagadorTelefone;
  }
  origem(): string {
    return this.props.origem;
  }
  origemUuid(): string {
    return this.props.origemUuid;
  }
  valor(): number {
    return this.props.valor;
  }
}
