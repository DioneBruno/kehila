import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type DominioListItem = {
  uuid: string;
  domain: string | null;
  active: boolean;
  createdAt: string;
};

export class ListarDominiosRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(companyUuid: string): Promise<DominioListItem[]> {
    return this.connectionHub.database!.query(
      `
      SELECT
        d.uuid,
        d.domain,
        d.active,
        d.created_at AS "createdAt"
      FROM auth_company_domains d
      WHERE d.deleted_at IS NULL
        AND d.company_uuid = $1
      ORDER BY d.created_at DESC
      `,
      [companyUuid],
    );
  }
}
