import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { UserEntity } from "./user.entity";

export type CompanyData = {
  uuid: string;
  name: string;
  cpfCnpj: string;
};

export type FindUserResult = {
  user: UserEntity;
  company: CompanyData;
};

export class TokenGenerateRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async findUser(companyUuid: string, userName: string): Promise<UserEntity | null> {
    const [row] = await this.connectionHub.database.query(
      `
      SELECT
        users.uuid AS user_uuid,
        users.cpf,
        users.email,
        users.name,
        users.password,
        c.uuid AS company_uuid,
        c.name AS company_name,
        c.cpf_cnpj
      FROM auth_users users
        INNER JOIN auth_users_companies uc
          ON uc.user_uuid = users.uuid
        INNER JOIN auth_companies c
          ON c.uuid = uc.company_uuid
      WHERE users.deleted_at IS NULL
        AND (users.email = $1 OR users.cpf = $1 OR users.name = $1)
        AND c.uuid = $2
    `,
      [userName, companyUuid],
    );

    if (!row) return null;

    return new UserEntity({
      uuid: row.user_uuid,
      cpf: row.cpf,
      email: row.email,
      name: row.name,
      password: row.password,
      company: {
        uuid: row.company_uuid,
        name: row.company_name,
        cpfCnpj: row.cpf_cnpj,
      },
    });
  }
}
