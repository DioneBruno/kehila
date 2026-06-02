import { IngressosEntity } from "./ingressos.entity";

export type PedidoProps = {
  uuid: string;
  companyUuid: string;
  eventoUuid: string;
  userUuid: string;
  idempotencyKey: string;
  valorBruto: number;
  desconto: number;
  valorLiquido: number;
  expiresAt?: string;
  ingressos: IngressosEntity[];
};

export class PedidoEntity {
  constructor(readonly props: PedidoProps) {}

  uuid(): string {
    return this.props.uuid;
  }
  companyUuid(): string {
    return this.props.companyUuid;
  }
  eventoUuid(): string {
    return this.props.eventoUuid;
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
  expiresAt(): string | undefined {
    return this.props.expiresAt;
  }
  ingressos(): IngressosEntity[] {
    return this.props.ingressos;
  }

  toJson() {
    return {
      uuid: this.props.uuid,
    };
  }
}
