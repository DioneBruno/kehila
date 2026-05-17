import { ConnectionHub } from "src/@modules/shared/connectionHub";

export type EditarTipoIngressoData = {
  uuid: string;
  companyUuid: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco: number;
  visivel: boolean;
};

export class EditarTipoIngressoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscar(uuid: string, companyUuid: string): Promise<{ uuid: string; vendidos: number } | null> {
    const [row] = await this.connectionHub.database.query(
      `SELECT uuid, vendidos FROM evento_lote_tipos_ingresso WHERE uuid = $1 AND company_uuid = $2`,
      [uuid, companyUuid],
    );
    return row ?? null;
  }

  async editar(data: EditarTipoIngressoData): Promise<void> {
    await this.connectionHub.database.query(
      `
      UPDATE evento_lote_tipos_ingresso SET
        nome = $1, descricao = $2, quantidade = $3, preco = $4, visivel = $5, updated_at = now()
      WHERE uuid = $6 AND company_uuid = $7
      `,
      [
        data.nome,
        data.descricao ?? null,
        data.quantidade,
        data.preco,
        data.visivel,
        data.uuid,
        data.companyUuid,
      ],
    );
  }
}
