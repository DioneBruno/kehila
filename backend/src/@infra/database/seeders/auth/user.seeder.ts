import * as bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await dataSource.query(`DELETE FROM auth_users`);
    await dataSource.query(`DELETE FROM auth_users_companies`);

    const users = [
      {
        uuid: process.env.SYSTEM_USER_UUID,
        name: "Usuário padrão",
        cpf: "12345678909",
        email: "admin@email.com.br",
        password: await bcryptjs.hash("123456", 10),
        email_confirmed_at: "2025-01-01",
        is_accepted: true,
        is_verify: true,
        is_super_admin: true,
      },
    ];

    for (let i = 0; i < users.length; i++) {
      const userModel = users[i];
      await dataSource.query(
        `INSERT INTO auth_users (uuid, name, cpf, email, password, email_confirmed_at, is_verify, is_super_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userModel.uuid,
          userModel.name,
          userModel.cpf,
          userModel.email,
          userModel.password,
          userModel.email_confirmed_at,
          userModel.is_verify,
          userModel.is_super_admin,
        ],
      );

      await dataSource.query(
        `INSERT INTO auth_users_companies (uuid, user_uuid, company_uuid, is_accepted, position)
      VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), userModel.uuid, process.env.SYSTEM_COMPANY_UUID, true, "admin"],
      );
    }
  }
}
