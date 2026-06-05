import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { UserEntity } from "./user.entity";

export class GenerateTokenAuthenticationUserRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarUsuario(companyUuid: string, userUuid: string) {
    const [usuarioModel] = await this.connectionHub.database!.query(
      `SELECT 
        users.uuid,
        users.cpf,
        users.name,
        users.email,
        companies.uuid AS company_uuid,
        companies.name AS company_name,
        companies.cpf_cnpj AS company_cpf_cnpj
      FROM auth_users users
        INNER JOIN auth_users_companies "userCompanies"
          ON users.uuid = "userCompanies".user_uuid
        INNER JOIN auth_companies companies
          ON "userCompanies".company_uuid = companies.uuid
      WHERE users.uuid = $2
        AND companies.uuid = $1
      `,
      [companyUuid, userUuid],
    );
    if (!usuarioModel) return null;

    const usuario = new UserEntity({
      company: {
        uuid: usuarioModel.company_uuid,
        name: usuarioModel.company_name,
        cpfCnpj: usuarioModel.company_cpf_cnpj,
      },
      cpf: usuarioModel.cpf,
      email: usuarioModel.email,
      name: usuarioModel.name,
      uuid: usuarioModel.uuid,
    });

    return usuario;
  }
}
