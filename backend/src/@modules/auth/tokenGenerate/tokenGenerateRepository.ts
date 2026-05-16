import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { UserEntity } from "./user.entity";

export class TokenGenerateRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async findUser(companyUuid: string, userName: string): Promise<UserEntity | null> {
    const [userModel] = await this.connectionHub.database.query(
      `
      SELECT *
      FROM auth_users users
        INNER JOIN auth_users_companies companies
          ON companies.user_uuid = users.uuid
      WHERE users.deleted_at IS NULL
        AND (users.email = $1 OR users.cpf = $1)
        AND companies.company_uuid = $2
    `,
      [userName, companyUuid],
    );

    if (!userModel) return null;
    return new UserEntity({
      uuid: userModel.uuid,
      cpf: userModel.cpf,
      email: userModel.email,
      name: userModel.name,
      password: userModel.password,
    });
  }
}
