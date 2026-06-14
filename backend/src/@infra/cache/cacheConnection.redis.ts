require("dotenv").config();
import { RedisClientType } from "redis";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ConnectionCacheInterface } from "src/@modules/shared/connections/connectionCache.interface";

export class ConnectionCacheRedis implements ConnectionCacheInterface {
  constructor(readonly client: RedisClientType) {}
  async findKey(key: string): Promise<any> {
    const payload = await this.client.HGETALL(key);
    if (!payload) return null;
    if (JSON.stringify(payload) == "{}") return null;
    return payload;
  }

  async saveObject(key: string, object: object, expireSeconds: number): Promise<void> {
    if (!expireSeconds) expireSeconds = 5;
    for (let i = 0; i < Object.keys(object).length; i++) {
      const objectKey = Object.keys(object)[i];
      if (!object[objectKey]) continue;
      await this.client.HSET(key, objectKey, object[objectKey]);
    }
    const time = Math.round(1000 * expireSeconds);
    const expireTime = ApiDate.timeToDate(ApiDate.nowTime() + time);
    await this.client.expireAt(key, new Date(expireTime));
  }

  async deleteKey(key: string): Promise<void> {
    await this.client.DEL(key);
  }
}
