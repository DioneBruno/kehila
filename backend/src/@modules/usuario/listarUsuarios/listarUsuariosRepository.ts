import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type UsuarioListItem = {
  uuid: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  roles: string[];
  isAccepted: boolean;
  isVerify: boolean;
  createdAt: string;
};

export type ListarUsuariosParams = {
  companyUuid: string;
  busca?: string;
  pagina: number;
  porPagina: number;
};

export type ListarUsuariosResult = {
  dados: UsuarioListItem[];
  total: number;
};

export class ListarUsuariosRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(params: ListarUsuariosParams): Promise<ListarUsuariosResult> {
    const { companyUuid, busca, pagina, porPagina } = params;
    const offset = (pagina - 1) * porPagina;

    const filterBindings: unknown[] = [companyUuid];
    let filterWhere = `WHERE u.deleted_at IS NULL AND uc.deleted_at IS NULL AND uc.company_uuid = $1`;
    let idx = 2;

    if (busca) {
      filterWhere += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.cpf ILIKE $${idx})`;
      filterBindings.push(`%${busca}%`);
      idx++;
    }

    const [countRow] = await this.connectionHub.database!.query(
      `
      SELECT COUNT(*) AS total
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      ${filterWhere}
      `,
      filterBindings,
    );

    const rows = await this.connectionHub.database!.query(
      `
      SELECT
        u.uuid,
        u.name,
        u.cpf,
        u.email,
        u.phone,
        uc.position,
        uc.roles,
        uc.is_accepted AS "isAccepted",
        u.is_verify AS "isVerify",
        u.created_at AS "createdAt"
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      ${filterWhere}
      ORDER BY u.name ASC
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
