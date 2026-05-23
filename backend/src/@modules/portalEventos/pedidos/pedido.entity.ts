import { IngressosEntity } from "./ingressos.entity";

export type PedidoProps = {
  uuid: string;
  userUuid: string;
  idempotencyKey: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  expiresAt: string;
  ingressos: IngressosEntity[];
};

export class PedidoEntity {
  constructor(readonly props: PedidoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  userUuid(): string {
    return this.props.userUuid;
  }
  idempotencyKey(): string {
    return this.props.idempotencyKey;
  }
  valorBruto(): number {
    return this.props.valorBruto;
  }
  desconto(): number {
    return this.props.desconto;
  }
  valorLiquido(): number {
    return this.props.valorLiquido;
  }
  expiresAt(): string {
    return this.props.expiresAt;
  }
}
