import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type ContaBancariaListItem = {
  uuid: string;
  nome: string | null;
  bancoNumero: string | null;
  agencia: string | null;
  conta: string | null;
  digito: string | null;
  status: string | null;
  createdAt: string;
};

export type ListarContasBancariasParams = {
  companyUuid: string;
  busca?: string;
  status?: string;
  pagina: number;
  porPagina: number;
};

export type ListarContasBancariasResult = {
  dados: ContaBancariaListItem[];
  total: number;
};

export class ListarContasBancariasRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(params: ListarContasBancariasParams): Promise<ListarContasBancariasResult> {
    const { companyUuid, busca, status, pagina, porPagina } = params;
    const offset = (pagina - 1) * porPagina;

    const filterBindings: unknown[] = [companyUuid];
    let filterWhere = `WHERE cb.deleted_at IS NULL AND cb.company_uuid = $1`;
    let idx = 2;

    if (status) {
      filterWhere += ` AND cb.status = $${idx}`;
      filterBindings.push(status);
      idx++;
    }

    if (busca) {
      filterWhere += ` AND cb.nome ILIKE $${idx}`;
      filterBindings.push(`%${busca}%`);
      idx++;
    }

    const [countRow] = await this.connectionHub.database!.query(
      `SELECT COUNT(*) AS total FROM financeiro_contas_bancarias cb ${filterWhere}`,
      filterBindings,
    );

    const rows = await this.connectionHub.database!.query(
      `
      SELECT
        cb.uuid,
        cb.nome,
        cb.banco_numero AS "bancoNumero",
        cb.agencia,
        cb.conta,
        cb.digito,
        cb.status,
        cb.created_at AS "createdAt"
      FROM financeiro_contas_bancarias cb
      ${filterWhere}
      ORDER BY cb.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...filterBindings, porPagina, offset],
    );

    return {
      dados: rows,
      total: parseInt(countRow.total, 10),
    };
  }
}
