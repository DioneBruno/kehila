import axios from "axios";
import { DataSource } from "typeorm";
import { ConnectionCacheInterface } from "./connectionCache.interface";

export class ConnectionHub {
  public database: DataSource | undefined;
  public http: axios.AxiosInstance | undefined;
  public cache: ConnectionCacheInterface | undefined;

  constructor(input: { database?: DataSource; http?: axios.AxiosInstance; cache?: ConnectionCacheInterface }) {
    this.database = input.database;
    this.http = input.http;
    this.cache = input.cache;
  }
}
