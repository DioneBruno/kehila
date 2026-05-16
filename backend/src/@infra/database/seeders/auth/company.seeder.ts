import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
export class CompanySeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    await dataSource.query(`DELETE FROM auth_companies`);
    await dataSource.query(`INSERT INTO auth_companies (uuid, tenant_id, name, cpf_cnpj, email, uf, address, phone, state_registration, commercial_name)
      VALUES ('${process.env.SYSTEM_COMPANY_UUID}', 'default', 'Empresa Padrão', '00000000000001', 'empresa@email.com', 'FF', '{}', '', '23343412312', 'Empresa')
       `);
  }
}
