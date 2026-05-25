export interface ConnectionCacheInterface {
  saveObject(key: string, object: object, expireSeconds: number): Promise<void>;
  findKey(key: string): Promise<any>;
  deleteKey(key: string): Promise<void>;
}
