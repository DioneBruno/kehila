import { ApiError } from "src/@modules/shared/apiError";

export type PagamentoProps = {
  uuid: string;
  valor: number;
  pagoEm: string;
  valorPago: number;
  pagoDescricao: string;
  pagoUserUuid: string;
  status: string;
};

export type InformarPagamentoManualInput = {
  userUuid: string;
  valorPago: number;
  pagoEm: string;
  pagoDescricao: string;
};

export class PagamentoEntity {
  constructor(readonly props: PagamentoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  valor(): number {
    return this.props.valor;
  }
  pagoEm(): string {
    return this.props.pagoEm;
  }
  valorPago(): number {
    return this.props.valorPago;
  }
  pagoDescricao(): string {
    return this.props.pagoDescricao;
  }
  pagoUserUuid(): string {
    return this.props.pagoUserUuid;
  }
  status(): string {
    return this.props.status;
  }
  formaPagamento(): string {
    return "manual";
  }
  informarPagamentoManual(input: InformarPagamentoManualInput): void {
    if (input.valorPago < this.props.valor) throw new ApiError("Valor pago não pode ser menor que valor cobrado");
    this.props.pagoEm = input.pagoEm;
    this.props.valorPago = input.valorPago;
    this.props.pagoDescricao = input.pagoDescricao;
    this.props.pagoUserUuid = input.userUuid;
    this.props.status = "pago";
  }
}
