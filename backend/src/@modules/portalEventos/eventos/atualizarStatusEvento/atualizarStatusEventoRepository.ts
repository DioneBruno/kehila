import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class AtualizarStatusEventoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarStatus(companyUuid: string, eventoUuid: string): Promise<string | null> {
    const [row] = await this.connectionHub.database.query(`SELECT status FROM eventos WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`, [
      eventoUuid,
      companyUuid,
    ]);
    return row?.status ?? null;
  }

  async atualizarStatus(companyUuid: string, eventoUuid: string, novoStatus: string): Promise<void> {
    await this.connectionHub.database.query(`UPDATE eventos SET status = $1, updated_at = now() WHERE uuid = $2 AND company_uuid = $3`, [
      novoStatus,
      eventoUuid,
      companyUuid,
    ]);
  }
}
