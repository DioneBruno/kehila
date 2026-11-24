import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImovelEntity, MSG_PROPRIETARIO_NAO_ENCONTRADO } from "../imovel.entity";

export class IncluirImovelRepository {
  constructor(readonly connections: ConnectionHub) {}

  /** Valida o proprietário (mesma empresa), insere o imóvel como 'livre' e liga eh_proprietario, tudo na mesma transação. */
  async incluir(imovel: ImovelEntity): Promise<void> {
    const p = imovel.props;
    const e = p.endereco;
    await this.connections.database.transaction(async (manager) => {
      // UPDATE ... RETURNING no TypeORM/pg devolve [linhas, quantidade]
      const [donos] = await manager.query(
        `UPDATE imovel_pessoas SET eh_proprietario = true, updated_at = now()
         WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2 RETURNING uuid`,
        [p.companyUuid, p.proprietarioUuid],
      );
      if (!donos?.length) throw new ApiError(MSG_PROPRIETARIO_NAO_ENCONTRADO, 404);

      await manager.query(
        `
        INSERT INTO imovel_imoveis (
          uuid, company_uuid, proprietario_uuid, identificacao, tipo, finalidade,
          endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf,
          inscricao_iptu, matricula, cartorio, area_m2, situacao, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'livre', $18)
        `,
        [
          p.uuid,
          p.companyUuid,
          p.proprietarioUuid,
          p.identificacao,
          p.tipo,
          p.finalidade,
          e.cep,
          e.logradouro,
          e.numero,
          e.complemento,
          e.bairro,
          e.cidade,
          e.uf,
          p.inscricaoIptu,
          p.matricula,
          p.cartorio,
          p.areaM2,
          p.observacoes,
        ],
      );
    });
  }
}
