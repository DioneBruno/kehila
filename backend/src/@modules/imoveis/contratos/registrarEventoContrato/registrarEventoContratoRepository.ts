import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ContratoEventoTipo, ContratoStatus } from "../../shared/imoveis.tipos";
import { MSG_CONTRATO_NAO_ENCONTRADO, MSG_CONTRATO_NAO_VIGENTE } from "../contrato.entity";

export type ContratoAtual = {
  uuid: string;
  imovelUuid: string;
  status: ContratoStatus;
  inicio: string;
  fim: string;
  valorAluguel: number;
};

export type EventoDecidido = {
  tipo: ContratoEventoTipo;
  data: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  fimAnterior: string | null;
  fimNovo: string | null;
  /** Novo status quando o evento encerra o contrato (o imóvel volta para 'livre'). */
  statusNovo: Exclude<ContratoStatus, "vigente"> | null;
};

export class RegistrarEventoContratoRepository {
  constructor(readonly connections: ConnectionHub) {}

  /**
   * Trava o contrato vigente (FOR UPDATE), deixa `decidir` aplicar as regras sobre o estado travado,
   * grava o evento e atualiza contrato (e imóvel, se encerrou) na mesma transação.
   */
  async registrar(
    companyUuid: string,
    userUuid: string | null,
    contratoUuid: string,
    decidir: (atual: ContratoAtual) => EventoDecidido,
  ): Promise<string> {
    return this.connections.database.transaction(async (manager) => {
      const [atual]: ContratoAtual[] = await manager.query(
        `SELECT uuid, imovel_uuid AS "imovelUuid", status, TO_CHAR(inicio, 'YYYY-MM-DD') AS inicio, TO_CHAR(fim, 'YYYY-MM-DD') AS fim,
                valor_aluguel::float8 AS "valorAluguel"
         FROM imovel_contratos WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL FOR UPDATE`,
        [contratoUuid, companyUuid],
      );
      if (!atual) throw new ApiError(MSG_CONTRATO_NAO_ENCONTRADO, 404);
      if (atual.status !== "vigente") throw new ApiError(MSG_CONTRATO_NAO_VIGENTE, 409);

      const e = decidir(atual);
      const eventoUuid = randomUUID();
      await manager.query(
        `INSERT INTO imovel_contrato_eventos (
           uuid, company_uuid, contrato_uuid, tipo, data, descricao, valor_anterior, valor_novo, fim_anterior, fim_novo, criado_por_uuid
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [eventoUuid, companyUuid, contratoUuid, e.tipo, e.data, e.descricao, e.valorAnterior, e.valorNovo, e.fimAnterior, e.fimNovo, userUuid],
      );

      if (e.statusNovo) {
        await manager.query(`UPDATE imovel_contratos SET status = $1, encerrado_em = $2, updated_at = now() WHERE uuid = $3 AND company_uuid = $4`, [
          e.statusNovo,
          e.data,
          contratoUuid,
          companyUuid,
        ]);
        await manager.query(
          `UPDATE imovel_imoveis SET situacao = 'livre', updated_at = now() WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
          [atual.imovelUuid, companyUuid],
        );
      } else {
        await manager.query(
          `UPDATE imovel_contratos SET fim = COALESCE($1::date, fim), valor_aluguel = COALESCE($2::numeric, valor_aluguel), updated_at = now()
           WHERE uuid = $3 AND company_uuid = $4`,
          [e.fimNovo, e.valorNovo, contratoUuid, companyUuid],
        );
      }
      return eventoUuid;
    });
  }
}
