import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { EventoEntity } from "./evento.entity";
import { TipoEngressoEntity } from "./tipoEngresso.entity";
import { PedidoEntity } from "./pedido.entity";

export class CriarPedidoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscaEvento(companyUuid: string, eventoUuid: string): Promise<EventoEntity | null> {
    const [eventoModel] = await this.connectionHub.database.query(`SELECT * FROM eventos WHERE deleted_at IS NULL AND uuid = $1`, [eventoUuid]);
    if (!eventoModel) return null;

    const tiposEngresso: TipoEngressoEntity[] = [];
    const tipoEngressosModel = await this.connectionHub.database.query(
      `SELECT *
      FROM evento_lote_tipos_ingresso
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND evento_uuid = $2`,
      [companyUuid, eventoUuid],
    );
    for (const tipoEngressoModel of tipoEngressosModel) {
      tiposEngresso.push(
        new TipoEngressoEntity({
          uuid: tipoEngressoModel.uuid,
          nome: tipoEngressoModel.nome,
          quantidade: tipoEngressoModel.quantidade,
          preco: tipoEngressoModel.preco,
        }),
      );
    }

    const eventosEntity = new EventoEntity({
      companyUuid,
      uuid: eventoUuid,
      tiposEngresso,
    });
    return eventosEntity;
  }

  async salvarPedido(pedido: PedidoEntity): Promise<void> {}
}
