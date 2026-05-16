import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
export class CompanyTemplatesSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    await dataSource.query(`DELETE FROM auth_company_templates`);
    await dataSource.query(`INSERT INTO auth_company_templates (uuid, company_uuid, title, active, meta, header, login, email)
      VALUES ('${randomUUID()}', '${process.env.SYSTEM_COMPANY_UUID}', 'Padrão', true, '{}', '{}', '{}', '{}')
       `);
  }
}
