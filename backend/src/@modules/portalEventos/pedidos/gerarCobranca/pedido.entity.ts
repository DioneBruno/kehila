import { PagadorEntity } from "./pagador.entity";

export type PedidoProps = {
  companyUuid: string;
  userUuid: string;
  uuid: string;
  usuario: PagadorEntity;
  valorBruno: number;
  valorDesconto: number;
  valorTotal: number;
  dataLimitePagamento?: string | null;
};

export class PedidoEntity {
  constructor(readonly props: PedidoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  userUuid(): string {
    return this.props.userUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  usuario(): PagadorEntity {
    return this.props.usuario;
  }
  valorBruno(): number {
    return this.props.valorBruno;
  }
  valorDesconto(): number {
    return this.props.valorDesconto;
  }
  valorTotal(): number {
    return this.props.valorTotal;
  }
  dataLimitePagamento(): string | null {
    return this.props.dataLimitePagamento ?? null;
  }
}
