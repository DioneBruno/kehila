import * as bcryptjs from "bcryptjs";
import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    await dataSource.query(`DELETE FROM auth_users`);

    const users = [
      {
        uuid: "018979ce-6b9e-403a-adcb-3fb537c67b16",
        name: "Usuário padrão",
        cpf: "12345678909",
        email: "admin@email.com.br",
        password: await bcryptjs.hash("123456", 10),
        email_confirmed_at: new Date(),
        email_confirmed: true,
        is_accepted: true,
        is_verify: true,
        permissions: { allowedModules: [] },
      },
    ];

    for (let i = 0; i < users.length; i++) {
      const userModel = users[i];
      await dataSource.query(
        `INSERT INTO auth_users (uuid, name, cpf, email, password, email_confirmed_at, email_confirmed, is_verify, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          userModel.uuid,
          userModel.name,
          userModel.cpf,
          userModel.email,
          userModel.password,
          userModel.email_confirmed_at,
          userModel.email_confirmed,
          userModel.is_verify,
          userModel.permissions,
        ],
      );
    }
  }
}
