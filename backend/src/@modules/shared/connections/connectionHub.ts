import { DataSource } from "typeorm";

export class ConnectionHub {
  constructor(public readonly database: DataSource) {}
}
