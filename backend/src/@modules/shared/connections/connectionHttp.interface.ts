export interface ConnectionHttpInterface {
  get(uri: string, headers?: any): Promise<{ status: string; statusText: string; data: any }>;
  delete(uri: string, headers?: any): Promise<{ status: string; statusText: string; data: any }>;
  post(uri: string, request?: any, headers?: any): Promise<{ status: string; statusText: string; data: any }>;
  put(uri: string, request?: any, headers?: any): Promise<{ status: string; statusText: string; data: any }>;
}
