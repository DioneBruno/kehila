import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import {
  ContratoEntity,
  ehViolacaoContratoVigente,
  MSG_FIADOR_NAO_ENCONTRADO,
  MSG_IMOVEL_NAO_ENCONTRADO,
  MSG_IMOVEL_NAO_LIVRE,
  MSG_INQUILINO_NAO_ENCONTRADO,
  MSG_INQUILINO_PROPRIETARIO,
} from "../contrato.entity";

export class IncluirContratoRepository {
  constructor(readonly connections: ConnectionHub) {}

  /**
   * Numa transação: trava o imóvel (FOR UPDATE), exige 'livre', valida inquilino/fiador da empresa ligando as flags,
   * grava o contrato vigente e marca o imóvel como 'alugado'. O índice único parcial cobre qualquer corrida restante.
   */
  async incluir(contrato: ContratoEntity): Promise<void> {
    const p = contrato.props;
    try {
      await this.connections.database.transaction(async (manager) => {
        const [imovel] = await manager.query(
          `SELECT situacao, proprietario_uuid FROM imovel_imoveis WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL FOR UPDATE`,
          [p.imovelUuid, p.companyUuid],
        );
        if (!imovel) throw new ApiError(MSG_IMOVEL_NAO_ENCONTRADO, 404);
        if (imovel.situacao !== "livre") throw new ApiError(MSG_IMOVEL_NAO_LIVRE, 409);
        if (imovel.proprietario_uuid === p.inquilinoUuid) throw new ApiError(MSG_INQUILINO_PROPRIETARIO);

        // Trava inquilino e fiador em ordem fixa (uuid) antes de mexer nas flags: dois contratos com os papéis
        // trocados (A inquilino/B fiador x B inquilino/A fiador) travariam em ordem cruzada e dariam deadlock (40P01).
        await manager.query(
          `SELECT uuid FROM imovel_pessoas WHERE uuid = ANY($1::uuid[]) AND company_uuid = $2 AND deleted_at IS NULL ORDER BY uuid FOR UPDATE`,
          [[p.inquilinoUuid, p.fiadorUuid].filter(Boolean), p.companyUuid],
        );

        // UPDATE ... RETURNING no TypeORM/pg devolve [linhas, quantidade]
        const [inquilinos] = await manager.query(
          `UPDATE imovel_pessoas SET eh_inquilino = true, updated_at = now()
           WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 RETURNING uuid`,
          [p.companyUuid, p.inquilinoUuid],
        );
        if (!inquilinos?.length) throw new ApiError(MSG_INQUILINO_NAO_ENCONTRADO, 404);

        if (p.fiadorUuid) {
          const [fiadores] = await manager.query(
            `UPDATE imovel_pessoas SET eh_fiador = true, updated_at = now()
             WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 RETURNING uuid`,
            [p.companyUuid, p.fiadorUuid],
          );
          if (!fiadores?.length) throw new ApiError(MSG_FIADOR_NAO_ENCONTRADO, 404);
        }

        await manager.query(
          `
          INSERT INTO imovel_contratos (
            uuid, company_uuid, imovel_uuid, inquilino_uuid, numero, inicio, fim, valor_aluguel, dia_vencimento,
            indice_reajuste, mes_reajuste, multa_atraso_pct, juros_mes_pct, desconto_pontualidade_pct, multa_rescisoria_meses,
            garantia_tipo, garantia_valor, fiador_uuid, status, observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'vigente', $19)
          `,
          [
            p.uuid,
            p.companyUuid,
            p.imovelUuid,
            p.inquilinoUuid,
            p.numero,
            p.inicio,
            p.fim,
            p.valorAluguel,
            p.diaVencimento,
            p.indiceReajuste,
            p.mesReajuste,
            p.multaAtrasoPct,
            p.jurosMesPct,
            p.descontoPontualidadePct,
            p.multaRescisoriaMeses,
            p.garantiaTipo,
            p.garantiaValor,
            p.fiadorUuid,
            p.observacoes,
          ],
        );

        await manager.query(
          `UPDATE imovel_imoveis SET situacao = 'alugado', updated_at = now() WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
          [p.imovelUuid, p.companyUuid],
        );
      });
    } catch (erro) {
      if (ehViolacaoContratoVigente(erro)) throw new ApiError(MSG_IMOVEL_NAO_LIVRE, 409);
      throw erro;
    }
  }
}
