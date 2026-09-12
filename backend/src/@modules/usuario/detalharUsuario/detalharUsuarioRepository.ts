import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type UsuarioDetalhe = {
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
  updatedAt: string;
  randomCode: string[];
};

export class DetalharUsuarioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPorUuid(companyUuid: string, usuarioUuid: string): Promise<UsuarioDetalhe | null> {
    const [row] = await this.connectionHub.database!.query(
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
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      WHERE u.deleted_at IS NULL
        AND uc.deleted_at IS NULL
        AND uc.company_uuid = $1
        AND u.uuid = $2
      `,
      [companyUuid, usuarioUuid],
    );

    if (!row) return null;

    const randomCode = [];
    const tokensAcessoCpf = `auth_random_code:${companyUuid}:${row.cpf}`;
    const tokensCpf = await this.connectionHub.cache!.findKey(tokensAcessoCpf);
    if (tokensCpf) randomCode.push(tokensCpf.code);
    const tokensAcessoEmail = `auth_random_code:${companyUuid}:${row.email}`;
    const tokensEmail = await this.connectionHub.cache!.findKey(tokensAcessoEmail);
    if (tokensEmail) randomCode.push(tokensEmail.code);

    return {
      uuid: row.uuid,
      name: row.name,
      cpf: row.cpf,
      email: row.email,
      phone: row.phone,
      position: row.position,
      roles: row.roles,
      isAccepted: row.isAccepted,
      isVerify: row.isVerify,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      randomCode,
    };
  }
}
