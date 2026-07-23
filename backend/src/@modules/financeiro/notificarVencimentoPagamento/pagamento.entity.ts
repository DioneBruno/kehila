export type PagamentoProps = {
  companyUuid: string;
  uuid: string;
  pagadorNome: string;
  pagadorEmail: string;
  vencimento: string;
  linkBoleto: string;
  valor: number;
  quantidadeNotificacoes: number;
};

export class PagamentoEntity {
  constructor(readonly props: PagamentoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid() {
    return this.props.uuid;
  }
  pagadorNome(): string {
    return this.props.pagadorNome;
  }
  pagadorEmail(): string {
    return this.props.pagadorEmail;
  }
  vencimento(): string {
    return this.props.vencimento;
  }
  linkBoleto(): string {
    return this.props.linkBoleto;
  }
  valor(): number {
    return this.props.valor;
  }
  quantidadeNotificacoes(): number {
    return this.props.quantidadeNotificacoes;
  }
}
