import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { IngressosEntity } from "./ingressos.entity";
import { PedidoEntity } from "./pedido.entity";
import { TipoIngressoEntity } from "./tipoIngresso.entity";

export type EventoProps = {
  companyUuid: string;
  uuid: string;
  tiposIngresso: TipoIngressoEntity[];
};

export class EventoEntity {
  constructor(private readonly props: EventoProps) {}

  companyUuid(): string {
    return this.props.companyUuid;
  }
  uuid(): string {
    return this.props.uuid;
  }
  tiposIngresso(): TipoIngressoEntity[] {
    return this.props.tiposIngresso;
  }

  montaPedido(userUuid: string, input: { tipoIngressoUuid: string; quantidade: number }[]): PedidoEntity {
    const ingressos: IngressosEntity[] = [];
    let valorBruto = 0;
    if (!Array.isArray(input) || input.length === 0) throw new ApiError("Informe os ingressos do pedido", 400);
    for (const item of input) {
      const quantidade = Number(item?.quantidade);
      if (!Number.isInteger(quantidade) || quantidade < 1) {
        throw new ApiError("Quantidade de ingressos inválida", 400);
      }
      item.quantidade = quantidade;
    }
    for (const item of input) {
      // O tipo de ingresso precisa pertencer a este evento: sem isso o ingresso seria criado com valor zero.
      const tipo = this.props.tiposIngresso.find((t) => t.uuid() === item.tipoIngressoUuid);
      if (!tipo) throw new ApiError("Tipo de ingresso não encontrado para este evento", 400);
      // Soma todas as linhas do mesmo tipo para não burlar o limite de vagas repetindo o tipo no pedido.
      const quantidadeTotalDoTipo = input.filter((i) => i.tipoIngressoUuid === item.tipoIngressoUuid).reduce((total, i) => total + i.quantidade, 0);
      if (!tipo.temVagaDisponivel(quantidadeTotalDoTipo)) {
        throw new ApiError(`Não tem vaga disponível para o tipo de ingresso: ${tipo.nome()}`, 400);
      }
      valorBruto += tipo.preco() * item.quantidade;
      const gerarQtd = tipo.gerarQuantidadeIngressos() ?? 1;
      for (let i = 0; i < item.quantidade; i++) {
        if (gerarQtd > 1) {
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
