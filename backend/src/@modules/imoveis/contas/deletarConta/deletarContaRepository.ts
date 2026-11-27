import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MSG_CONTA_NAO_ENCONTRADA } from "../conta.entity";

export class DeletarContaRepository {
  constructor(readonly connections: ConnectionHub) {}

  /** Soft delete da conta e dos anexos dela, na mesma transação. */
  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const [c] = await manager.query(
        `SELECT uuid FROM imovel_contas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
        [companyUuid, uuid],
      );
      if (!c) throw new ApiError(MSG_CONTA_NAO_ENCONTRADA, 404);
      await manager.query(
        `UPDATE imovel_conta_anexos SET deleted_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND conta_uuid = $2`,
        [companyUuid, uuid],
      );
      await manager.query(`UPDATE imovel_contas SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
        companyUuid,
        uuid,
      ]);
    });
  }
}
