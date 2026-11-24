import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { imovelTemContratoVigente, travarImovel } from "../situacaoImovel";

export class DeletarImovelRepository {
  constructor(readonly connections: ConnectionHub) {}

  /**
   * Numa transação: trava o imóvel (FOR UPDATE), checa contrato vigente e faz o soft delete.
   * Com a linha travada, um IncluirContrato concorrente ou já commitou (e o EXISTS o vê) ou espera e depois não acha o imóvel.
   */
  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      if (!(await travarImovel(manager, companyUuid, uuid))) throw new ApiError("Imóvel não encontrado", 404);
      if (await imovelTemContratoVigente(manager, companyUuid, uuid)) throw new ApiError("Não é possível excluir imóvel com contrato vigente", 409);
      await manager.query(
        `UPDATE imovel_imoveis SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
        [companyUuid, uuid],
      );
    });
  }
}
