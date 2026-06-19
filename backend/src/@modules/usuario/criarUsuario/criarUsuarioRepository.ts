import { randomUUID } from "crypto";
import * as bcryptjs from "bcryptjs";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type CriarUsuarioData = {
  companyUuid: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  password?: string;
  position?: string;
  roles?: string[];
};

export type UsuarioCriado = {
  uuid: string;
};

export class CriarUsuarioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existeNaEmpresa(companyUuid: string, cpf?: string, email?: string): Promise<boolean> {
    if (!cpf && !email) return false;

    const [row] = await this.connectionHub.database!.query(
      `
      SELECT u.uuid
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      WHERE u.deleted_at IS NULL
        AND uc.deleted_at IS NULL
        AND uc.company_uuid = $1
        AND ((u.cpf = $2 AND $2 IS NOT NULL) OR (u.email = $3 AND $3 IS NOT NULL))
      `,
      [companyUuid, cpf ?? null, email ?? null],
    );

    return !!row;
  }

  async criar(data: CriarUsuarioData): Promise<UsuarioCriado> {
    const uuid = randomUUID();
    const passwordHash = data.password ? await bcryptjs.hash(data.password, 10) : null;

    await this.connectionHub.database!.query(
      `
      INSERT INTO auth_users (
        uuid, name, cpf, email, phone, password, password_date_update
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      `,
      [uuid, data.name, data.cpf ?? null, data.email ?? null, data.phone ?? null, passwordHash, passwordHash ? new Date() : null],
    );

    await this.connectionHub.database!.query(
      `
      INSERT INTO auth_users_companies (
        uuid, user_uuid, company_uuid, is_accepted, position, roles
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      `,
      [randomUUID(), uuid, data.companyUuid, true, data.position ?? null, JSON.stringify(data.roles ?? [])],
    );

    return { uuid };
  }
}
