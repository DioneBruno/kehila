import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { UserEntity } from "./user.entity";

export class TokenGenerateRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async findUser(companyUuid: string, userName: string): Promise<UserEntity | null> {
    const rows = await this.connectionHub.database.query(
      `
      SELECT *
      FROM auth_users users
      WHERE users.deleted_at IS NULL
        AND (users.email = $1 OR users.cpf = $1)
    `,
      [userName],
    );

    if (!rows[0]) return null;
    return new UserEntity(rows[0]);
  }
}
