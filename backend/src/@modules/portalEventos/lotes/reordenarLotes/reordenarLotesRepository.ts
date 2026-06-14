import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type ReordenarLotesItem = { uuid: string; ordem: number };

export class ReordenarLotesRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async reordenar(itens: ReordenarLotesItem[], companyUuid: string): Promise<void> {
    for (const item of itens) {
      await this.connectionHub.database!.query(
        `UPDATE evento_lotes SET ordem = $1, updated_at = now() WHERE uuid = $2 AND company_uuid = $3`,
        [item.ordem, item.uuid, companyUuid],
      );
    }
  }
}
