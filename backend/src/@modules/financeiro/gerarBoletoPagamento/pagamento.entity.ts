export type PagamentoProps = {
  uuid: string;
  companyUuid: string;
  pagadorNome: string;
  pagadorDocumento: string;
  pagadorEmail: string;
  pagadorTelefone: string;
  vencimento: string;
  valor: number;
  valorComDescGateway: number;
  status: string;
  bancoRef: string;
  linkBoleto: string;
};

export class PagamentoEntity {
  constructor(readonly props: PagamentoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  companyUuid(): string {
    return this.props.companyUuid;
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
  vencimento(): string {
    return this.props.vencimento;
  }
  valor(): number {
    return this.props.valor;
  }
  valorComDescGateway(): number {
    return this.props.valorComDescGateway;
  }
  status(): string {
    return this.props.status;
  }
  bancoRef(): string {
    return this.props.bancoRef;
  }
  linkBoleto(): string {
    return this.props.linkBoleto;
  }
  setDadosBanco(input: { bancoRef: string; linkBoleto: string; valor: number; valorComDescGateway: number; status: string }) {
    this.props.bancoRef = input.bancoRef;
    this.props.linkBoleto = input.linkBoleto;
    this.props.valor = input.valor;
    this.props.valorComDescGateway = input.valorComDescGateway;
    this.props.status = input.status;
  }
}
