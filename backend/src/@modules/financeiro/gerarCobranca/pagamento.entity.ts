export type PagamentoProps = {
  uuid: string;
  bancoRef?: string;
  vencimento: string;
  nossoNumero: string;
  pix: string;
  linkBoleto: string;
  codigoBarras: string;
  linhaDigitavel: string;
  valor: number;
  valorComDescGateway: number;
  valorPago: number;
  status: string;
};

export class PagamentoEntity {
  constructor(readonly props: PagamentoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  bancoRef(): string | undefined {
    return this.props.bancoRef;
  }
  vencimento(): string {
    return this.props.vencimento;
  }
  nossoNumero(): string {
    return this.props.nossoNumero;
  }
  pix(): string {
    return this.props.pix;
  }
  linkBoleto(): string {
    return this.props.linkBoleto;
  }
  codigoBarras(): string {
    return this.props.codigoBarras;
  }
  linhaDigitavel(): string {
    return this.props.linhaDigitavel;
  }
  valor(): number {
    return this.props.valor;
  }
  valorComDescGateway(): number {
    return this.props.valorComDescGateway;
  }
  valorPago(): number {
    return this.props.valorPago;
  }
  status(): string {
    return this.props.status;
  }
}
