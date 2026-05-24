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

  montaPedido(userUuid: string, input: { tipoIngressoUuid: string; quantidade: number }[]): PedidoEntity {
    const ingressos: IngressosEntity[] = [];
    let valorBruto = 0;
    for (const item of input) {
      const tipo = this.props.tiposEngresso.find((t) => t.uuid() === item.tipoIngressoUuid);
      if (tipo) valorBruto += tipo.preco() * item.quantidade;
      const gerarQtd = tipo?.gerarQuantidadeIngressos() ?? 1;
      for (let i = 0; i < item.quantidade; i++) {
        if (gerarQtd > 1) {
          ingressos.push(
            new IngressosEntity({
              uuid: randomUUID(),
              codigo: randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase(),
              tipoIngressoUuid: tipo!.loteUuid(),
            }),
          );
          for (let j = 0; j < gerarQtd; j++) {
            ingressos.push(
              new IngressosEntity({
                uuid: randomUUID(),
                codigo: randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase(),
                tipoIngressoUuid: item.tipoIngressoUuid,
              }),
            );
          }
        } else {
          ingressos.push(
            new IngressosEntity({
              uuid: randomUUID(),
              codigo: randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase(),
              tipoIngressoUuid: item.tipoIngressoUuid,
            }),
          );
        }
      }
    }
    valorBruto = Math.round(valorBruto * 100) / 100;
    return new PedidoEntity({
      uuid: randomUUID(),
      userUuid,
      companyUuid: this.props.companyUuid,
      eventoUuid: this.props.uuid,
      idempotencyKey: randomUUID(),
      valorBruto,
      desconto: 0,
      valorLiquido: valorBruto,
      ingressos,
    });
  }
}
