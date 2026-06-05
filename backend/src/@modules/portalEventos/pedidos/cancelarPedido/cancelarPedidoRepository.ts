import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class CancelarPedidoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarStatus(pedidoUuid: string, userUuid: string): Promise<string | null> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT status FROM evento_pedidos WHERE uuid = $1 AND user_uuid = $2 AND deleted_at IS NULL`,
      [pedidoUuid, userUuid],
    );
    return row?.status ?? null;
  }

  async cancelarPedido(pedidoUuid: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE evento_pedidos SET status = 'cancelado', updated_at = now() WHERE uuid = $1`,
      [pedidoUuid],
    );
  }
}
