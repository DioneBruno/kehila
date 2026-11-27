import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ContaDados } from "../conta.entity";
import { resolverVinculosConta } from "../vinculosConta";

export type ContaLinha = ContaDados & {
  uuid: string;
  proprietarioUuid: string;
  pagoEm: string | null;
  valorPago: number | null;
  grupoUuid: string | null;
  parcelaNumero: number | null;
  parcelaTotal: number | null;
};

export class IncluirContaRepository {
  constructor(readonly connections: ConnectionHub) {}

  /** Numa transação: trava e valida os vínculos (iguais em todas as linhas) e insere todas as contas. */
  async incluir(companyUuid: string, contas: ContaLinha[]): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const { proprietarioUuid } = await resolverVinculosConta(manager, companyUuid, contas[0]);
      for (const c of contas) {
        await manager.query(
          `
          INSERT INTO imovel_contas (
            uuid, company_uuid, tipo, categoria, esfera, descricao, proprietario_uuid, imovel_uuid, contrato_uuid, responsavel,
            competencia, vencimento, valor, pago_em, valor_pago, fornecedor, documento_numero, grupo_uuid, parcela_numero,
            parcela_total, observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          `,
          [
            c.uuid,
            companyUuid,
            c.tipo,
            c.categoria,
            c.esfera,
            c.descricao,
            proprietarioUuid,
            c.imovelUuid,
            c.contratoUuid,
            c.responsavel,
            c.competencia,
            c.vencimento,
            c.valor,
            c.pagoEm,
            c.valorPago,
            c.fornecedor,
            c.documentoNumero,
            c.grupoUuid,
            c.parcelaNumero,
            c.parcelaTotal,
            c.observacoes,
          ],
        );
      }
    });
  }
}
