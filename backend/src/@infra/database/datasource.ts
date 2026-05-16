import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { SeederOptions } from "typeorm-extension";
import { join } from "path";
import { MainSeeder } from "./main.seeder";

const options: DataSourceOptions & SeederOptions = {
  type: process.env.DB_DEFAULT_DRIVER as any,
  host: process.env.DB_DEFAULT_HOST,
  port: process.env.DB_DEFAULT_PORT as any,
  database: process.env.DB_DEFAULT_NAME,
  username: process.env.DB_DEFAULT_USENAME,
  password: process.env.DB_DEFAULT_PASSWORD,
  synchronize: false,
  logging: false,
  subscribers: [],
  seeds: [MainSeeder],
  migrations: [join(__dirname, "/**/*.migrations.{ts,js}")],
};

const dataSource = new DataSource(options);

export default dataSource;
