import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MSG_CONTA_JA_PAGA, MSG_CONTA_NAO_ENCONTRADA, MSG_CONTA_NAO_PAGA } from "../conta.entity";

export class PagamentoContaRepository {
  constructor(readonly connections: ConnectionHub) {}

  /** Trava a conta; 404/409 conforme o estado; `calcular` valida o pagamento contra o valor da conta. */
  async registrar(
    companyUuid: string,
    uuid: string,
    calcular: (valorConta: number) => { pagoEm: string; valorPago: number },
  ): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const [c] = await manager.query(
        `SELECT valor::float8 AS valor, pago_em IS NOT NULL AS paga FROM imovel_contas
         WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
        [companyUuid, uuid],
      );
      if (!c) throw new ApiError(MSG_CONTA_NAO_ENCONTRADA, 404);
      if (c.paga) throw new ApiError(MSG_CONTA_JA_PAGA, 409);
      const { pagoEm, valorPago } = calcular(c.valor);
      await manager.query(`UPDATE imovel_contas SET pago_em = $3, valor_pago = $4, updated_at = now() WHERE company_uuid = $1 AND uuid = $2`, [
        companyUuid,
        uuid,
        pagoEm,
        valorPago,
      ]);
    });
  }

  async desfazer(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const [c] = await manager.query(
        `SELECT pago_em IS NOT NULL AS paga FROM imovel_contas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
        [companyUuid, uuid],
      );
      if (!c) throw new ApiError(MSG_CONTA_NAO_ENCONTRADA, 404);
      if (!c.paga) throw new ApiError(MSG_CONTA_NAO_PAGA, 409);
      await manager.query(`UPDATE imovel_contas SET pago_em = NULL, valor_pago = NULL, updated_at = now() WHERE company_uuid = $1 AND uuid = $2`, [
        companyUuid,
        uuid,
      ]);
    });
  }
}
