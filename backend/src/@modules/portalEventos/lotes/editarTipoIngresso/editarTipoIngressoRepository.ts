import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type EditarTipoIngressoData = {
  uuid: string;
  companyUuid: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  gerarQuantidadeIngressos: number;
  preco: number;
  visivel: boolean;
};

export class EditarTipoIngressoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscar(uuid: string, companyUuid: string): Promise<{ uuid: string; vendidos: number } | null> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid, vendidos FROM evento_lote_tipos_ingresso WHERE uuid = $1 AND company_uuid = $2`,
      [uuid, companyUuid],
    );
    return row ?? null;
  }

  async editar(data: EditarTipoIngressoData): Promise<void> {
    await this.connectionHub.database!.query(
      `
      UPDATE evento_lote_tipos_ingresso SET
        nome = $1, descricao = $2, quantidade = $3, gerar_quantidade_ingressos = $4, preco = $5, visivel = $6, updated_at = now()
      WHERE uuid = $7 AND company_uuid = $8
      `,
      [data.nome, data.descricao ?? null, data.quantidade, data.gerarQuantidadeIngressos, data.preco, data.visivel, data.uuid, data.companyUuid],
    );
  }
}
