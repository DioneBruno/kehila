import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ContaDados, MSG_CONTA_NAO_ENCONTRADA } from "../conta.entity";
import { resolverVinculosConta } from "../vinculosConta";

export class AlterarContaRepository {
  constructor(readonly connections: ConnectionHub) {}

  /**
   * Numa transação: trava a conta (FOR UPDATE), entrega os dados atuais (camelCase) a `mesclar`, que devolve o resultado
   * já validado; trava/valida os vínculos (contrato → imóvel → pessoa), re-deriva o proprietário (só se o imóvel mudou) e grava.
   */
  async alterar(companyUuid: string, uuid: string, mesclar: (atual: Record<string, unknown>) => ContaDados): Promise<void> {
    await this.connections.database.transaction(async (manager) => {
      const [c] = await manager.query(
        `SELECT tipo, categoria, esfera, descricao, proprietario_uuid, imovel_uuid, contrato_uuid, responsavel,
                competencia::text AS competencia, vencimento::text AS vencimento, valor::float8 AS valor, fornecedor,
                documento_numero, observacoes
         FROM imovel_contas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 FOR UPDATE`,
        [companyUuid, uuid],
      );
      if (!c) throw new ApiError(MSG_CONTA_NAO_ENCONTRADA, 404);

      const dados = mesclar({
        tipo: c.tipo,
        categoria: c.categoria,
        esfera: c.esfera,
        descricao: c.descricao,
        proprietarioUuid: c.proprietario_uuid,
        imovelUuid: c.imovel_uuid,
        contratoUuid: c.contrato_uuid,
        responsavel: c.responsavel,
        competencia: c.competencia,
        vencimento: c.vencimento,
        valor: c.valor,
        fornecedor: c.fornecedor,
        documentoNumero: c.documento_numero,
        observacoes: c.observacoes,
      });
      // Imóvel inalterado: o proprietário gravado fica (só re-deriva quando o imóvel muda).
      const imovelInalterado = !!dados.imovelUuid && dados.imovelUuid === c.imovel_uuid;
      const { proprietarioUuid } = await resolverVinculosConta(manager, companyUuid, dados, imovelInalterado ? c.proprietario_uuid : undefined);

      await manager.query(
        `UPDATE imovel_contas SET tipo = $3, categoria = $4, esfera = $5, descricao = $6, proprietario_uuid = $7, imovel_uuid = $8,
           contrato_uuid = $9, responsavel = $10, competencia = $11, vencimento = $12, valor = $13, fornecedor = $14,
           documento_numero = $15, observacoes = $16, updated_at = now()
         WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
        [
          companyUuid,
          uuid,
          dados.tipo,
          dados.categoria,
          dados.esfera,
          dados.descricao,
          proprietarioUuid,
          dados.imovelUuid,
          dados.contratoUuid,
          dados.responsavel,
          dados.competencia,
          dados.vencimento,
          dados.valor,
          dados.fornecedor,
          dados.documentoNumero,
          dados.observacoes,
        ],
      );
    });
  }
}
