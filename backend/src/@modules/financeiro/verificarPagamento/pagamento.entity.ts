export type PagamentoProps = {
  companyUuid: string;
  uuid: string;
  status: string;
  bancoRef: string;
  pagoEm?: string | null;
  valorPago?: number;
};

export class PagamentoEntity {
  constructor(readonly props: PagamentoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  status(): string {
    return this.props.status;
  }
  bancoRef(): string {
    return this.props.bancoRef;
  }
  pagoEm(): string | null | undefined {
    return this.props.pagoEm;
  }
  valorPago(): number | undefined {
    return this.props.valorPago;
  }

  receber(dataPagamento: string, valorPago: number): void {
    this.props.status = "pago";
    this.props.pagoEm = dataPagamento;
    this.props.valorPago = valorPago;
  }
}
