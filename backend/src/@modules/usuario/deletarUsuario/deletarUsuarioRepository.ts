import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarUsuarioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string, usuarioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `
      SELECT u.uuid
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      WHERE u.deleted_at IS NULL
        AND uc.deleted_at IS NULL
        AND uc.company_uuid = $1
        AND u.uuid = $2
      `,
      [companyUuid, usuarioUuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string, usuarioUuid: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE auth_users_companies SET deleted_at = now() WHERE user_uuid = $1 AND company_uuid = $2`,
      [usuarioUuid, companyUuid],
    );
  }
}
