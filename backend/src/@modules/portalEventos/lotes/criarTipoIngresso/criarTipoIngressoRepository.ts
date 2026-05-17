import { ConnectionHub } from "src/@modules/shared/connectionHub";

export type CriarTipoIngressoData = {
  companyUuid: string;
  eventoUuid: string;
  loteUuid: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco: number;
  visivel: boolean;
};

export type TipoIngressoCriado = {
  uuid: string;
};

export class CriarTipoIngressoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async loteExiste(loteUuid: string, companyUuid: string): Promise<{ uuid: string; eventoUuid: string } | null> {
    const [row] = await this.connectionHub.database.query(
      `SELECT uuid, evento_uuid AS "eventoUuid" FROM evento_lotes WHERE uuid = $1 AND company_uuid = $2`,
      [loteUuid, companyUuid],
    );
    return row ?? null;
  }

  async criar(data: CriarTipoIngressoData): Promise<TipoIngressoCriado> {
    const [row] = await this.connectionHub.database.query(
      `
      INSERT INTO evento_lote_tipos_ingresso (
        company_uuid, evento_uuid, lote_uuid, nome, descricao, quantidade, preco, visivel
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING uuid
      `,
      [
        data.companyUuid,
        data.eventoUuid,
        data.loteUuid,
        data.nome,
        data.descricao ?? null,
        data.quantidade,
        data.preco,
        data.visivel,
      ],
    );
    return row;
  }
}
