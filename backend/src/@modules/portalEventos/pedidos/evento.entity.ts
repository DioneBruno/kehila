import { randomUUID } from "crypto";
import { IngressosEntity } from "./ingressos.entity";
import { PedidoEntity } from "./pedido.entity";
import { TipoEngressoEntity } from "./tipoEngresso.entity";

export type EventoProps = {
  companyUuid: string;
  uuid: string;
  tiposEngresso: TipoEngressoEntity[];
};

export class EventoEntity {
  constructor(private readonly props: EventoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  tiposEngresso(): TipoEngressoEntity[] {
    return this.props.tiposEngresso;
  }

  montaPedido(input: { tipoIngressoUuid: string; quantidade: number }[]): PedidoEntity {
    const ingressos: IngressosEntity[] = [];
    for (const item of input) {
      for (let i = 0; i < item.quantidade; i++) {
        ingressos.push(
          new IngressosEntity({
            uuid: randomUUID(),
            codigo: randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase(),
            tipoIngressoUuid: item.tipoIngressoUuid,
          }),
        );
      }
    }
    return new PedidoEntity({
      uuid: randomUUID(),
      companyUuid: this.props.companyUuid,
      eventoUuid: this.props.uuid,
      idempotencyKey: randomUUID(),
      valorBruto: 0,
      desconto: 0,
      valorLiquido: 0,
      ingressos,
    });
  }
}
