import axios from "axios";
import { DataSource } from "typeorm";

export class ConnectionHub {
  public database: DataSource | undefined;
  public http: axios.AxiosInstance | undefined;

  constructor(input: { database?: DataSource; http?: axios.AxiosInstance }) {
    this.database = input.database;
    this.http = input.http;
  }
}
