import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class RemoverVinculoRepository {
  constructor(readonly connections: ConnectionHub) {}

  async buscar(companyUuid: string, vinculoUuid: string): Promise<{ pessoaUuid: string; pessoaVinculadaUuid: string } | null> {
    const [row] = await this.connections.database.query(
      `SELECT pessoa_uuid AS "pessoaUuid", pessoa_vinculada_uuid AS "pessoaVinculadaUuid" FROM auth_pessoas_vinculos WHERE company_uuid = $1 AND uuid = $2`,
      [companyUuid, vinculoUuid],
    );
    return row ?? null;
  }

  async removerPar(companyUuid: string, membroA: string, membroB: string): Promise<void> {
    await this.connections.database.query(
      `
      DELETE FROM auth_pessoas_vinculos
      WHERE company_uuid = $1
        AND ((pessoa_uuid = $2 AND pessoa_vinculada_uuid = $3) OR (pessoa_uuid = $3 AND pessoa_vinculada_uuid = $2))
      `,
      [companyUuid, membroA, membroB],
    );
  }
}
