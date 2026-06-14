import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type ReordenarTiposItem = { uuid: string; ordem: number };

export class ReordenarTiposIngressoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async reordenar(itens: ReordenarTiposItem[], companyUuid: string): Promise<void> {
    for (const item of itens) {
      await this.connectionHub.database!.query(
        `UPDATE evento_lote_tipos_ingresso SET ordem = $1, updated_at = now() WHERE uuid = $2 AND company_uuid = $3`,
        [item.ordem, item.uuid, companyUuid],
      );
    }
  }
}
