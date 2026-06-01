import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { UsuarioEntity } from "./usuario.entity";
import { randomUUID } from "crypto";

export class CadastrandoUsuarioRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async verificaCadastro(usuario: UsuarioEntity): Promise<boolean> {
    const [userModel] = await this.connectionHub.database.query(
      `SELECT users.uuid FROM auth_users users
        INNER JOIN auth_users_companies companies
          ON (users.uuid = companies.user_uuid)
      WHERE users.cpf = $1 AND companies.company_uuid = $2`,
      [usuario.cpf(), usuario.companyUuid()],
    );
    return !!userModel;
  }

  async salvarUsuario(usuario: UsuarioEntity) {
    await this.connectionHub.database.query(
      `INSERT INTO auth_users
      (uuid, name, cpf) VALUES ($1, $2, $3)`,
      [usuario.uuid(), usuario.nome(), usuario.cpf()],
    );

    await this.connectionHub.database.query(
      `INSERT INTO auth_users_companies
      (uuid, user_uuid, company_uuid, is_accepted) VALUES ($1, $2, $3, $4)`,
      [randomUUID(), usuario.uuid(), usuario.companyUuid(), true],
    );
  }
}
