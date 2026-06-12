import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type ContaBancariaDetalhe = {
  uuid: string;
  nome: string | null;
  bancoNumero: string | null;
  agencia: string | null;
  conta: string | null;
  digito: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
};

export class DetalharContaBancariaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPorUuid(companyUuid: string, contaBancariaUuid: string): Promise<ContaBancariaDetalhe | null> {
    const [row] = await this.connectionHub.database!.query(
      `
      SELECT
        cb.uuid,
        cb.nome,
        cb.banco_numero AS "bancoNumero",
        cb.agencia,
        cb.conta,
        cb.digito,
        cb.status,
        cb.created_at AS "createdAt",
        cb.updated_at AS "updatedAt"
      FROM financeiro_contas_bancarias cb
      WHERE cb.deleted_at IS NULL
        AND cb.company_uuid = $1
        AND cb.uuid = $2
      `,
      [companyUuid, contaBancariaUuid],
    );

    return row ?? null;
  }
}
