import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
export class CompanyDomainsSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    await dataSource.query(`DELETE FROM auth_company_domains`);
    await dataSource.query(`INSERT INTO auth_company_domains (uuid, company_uuid, domain, active)
      VALUES ('${randomUUID()}', '${process.env.SYSTEM_COMPANY_UUID}', '${process.env.SYSTEM_URL_APP}', true)
       `);
  }
}
