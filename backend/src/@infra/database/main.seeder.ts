import { DataSource } from "typeorm";
import { runSeeder, Seeder, SeederFactoryManager } from "typeorm-extension";
import { UserSeeder } from "./seeders/auth/user.seeder";
import { CompanySeeder } from "./seeders/auth/company.seeder";

export class MainSeeder implements Seeder {
  async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
    await runSeeder(dataSource, CompanySeeder);
    await runSeeder(dataSource, UserSeeder);
  }
}
