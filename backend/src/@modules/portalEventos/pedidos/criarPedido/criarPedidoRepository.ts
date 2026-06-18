import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { EventoEntity } from "./evento.entity";
import { TipoIngressoEntity } from "./tipoIngresso.entity";
import { PedidoEntity } from "./pedido.entity";

export class CriarPedidoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscaEvento(companyUuid: string, eventoUuid: string): Promise<EventoEntity | null> {
    const [eventoModel] = await this.connectionHub.database!.query(`SELECT * FROM eventos WHERE deleted_at IS NULL AND uuid = $1`, [eventoUuid]);
    if (!eventoModel) return null;

    const tiposIngresso: TipoIngressoEntity[] = [];
    const tipoIngressosModel = await this.connectionHub.database!.query(
      `SELECT *
      FROM evento_lote_tipos_ingresso
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND evento_uuid = $2`,
      [companyUuid, eventoUuid],
    );

    const vendidosModel = await this.connectionHub.database!.query(
      `SELECT tipo_ingresso_uuid, COUNT(*)::int AS quantidade
      FROM evento_ingressos
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND evento_uuid = $2
      GROUP BY tipo_ingresso_uuid`,
      [companyUuid, eventoUuid],
    );
    const vendidosPorTipo = new Map<string, number>(vendidosModel.map((v: any) => [v.tipo_ingresso_uuid, v.quantidade]));

    for (const tipoIngressoModel of tipoIngressosModel) {
      tiposIngresso.push(
        new TipoIngressoEntity({
          uuid: tipoIngressoModel.uuid,
          nome: tipoIngressoModel.nome,
          quantidade: tipoIngressoModel.quantidade,
          vendidos: vendidosPorTipo.get(tipoIngressoModel.uuid) ?? 0,
          preco: tipoIngressoModel.preco,
          loteUuid: tipoIngressoModel.lote_uuid,
          gerarQuantidadeIngressos: tipoIngressoModel.gerar_quantidade_ingressos ?? 1,
        }),
      );
    }

    const eventosEntity = new EventoEntity({
      companyUuid,
      uuid: eventoUuid,
      tiposIngresso,
    });
    return eventosEntity;
  }

  async salvarPedido(pedido: PedidoEntity): Promise<void> {
    await this.connectionHub.database!.query(
      `INSERT INTO evento_pedidos (uuid, company_uuid, evento_uuid, user_uuid, idempotency_key, status, valor_bruto, valor_desconto, valor_liquido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        pedido.uuid(),
        pedido.companyUuid(),
        pedido.eventoUuid(),
        pedido.userUuid() ?? null,
        pedido.idempotencyKey(),
        "pendente",
        pedido.valorBruto(),
        pedido.desconto(),
        pedido.valorLiquido(),
      ],
    );
    for (const ingresso of pedido.ingressos()) {
      await this.connectionHub.database!.query(
        `INSERT INTO evento_ingressos (uuid, company_uuid, evento_uuid, tipo_ingresso_uuid, pedido_uuid, codigo)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [ingresso.uuid(), pedido.companyUuid(), pedido.eventoUuid(), ingresso.tipoIngressoUuid(), pedido.uuid(), ingresso.codigo()],
      );
    }
  }
}
