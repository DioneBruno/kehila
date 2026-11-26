import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { SQL_ADMIN_ATIVO_BASE, UltimoAdminRepo } from "../ultimoAdmin";

export class DeletarUsuarioRepository implements UltimoAdminRepo {
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

  async ehAdminAtivo(companyUuid: string, usuarioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(`SELECT 1 ${SQL_ADMIN_ATIVO_BASE} AND u.uuid = $2`, [companyUuid, usuarioUuid]);
    return !!row;
  }

  async contarOutrosAdminsAtivos(companyUuid: string, usuarioUuid: string): Promise<number> {
    const [row] = await this.connectionHub.database!.query(`SELECT COUNT(*)::int AS total ${SQL_ADMIN_ATIVO_BASE} AND u.uuid <> $2`, [
      companyUuid,
      usuarioUuid,
    ]);
    return row?.total ?? 0;
  }

  async deletar(companyUuid: string, usuarioUuid: string): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE auth_users_companies SET deleted_at = now() WHERE user_uuid = $1 AND company_uuid = $2`,
      [usuarioUuid, companyUuid],
    );
  }
}
