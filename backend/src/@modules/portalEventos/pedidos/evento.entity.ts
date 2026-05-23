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
  montaPedido(input: { tipoIngressoUuid: string; quantidade: number }[]): PedidoEntity {}
}
