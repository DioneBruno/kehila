import type HttpClient from "../http/httpClient.interface";

export class BiGateway {
  constructor(readonly httpClient: HttpClient) {}

  async listBi(filtros: any) {
    return await this.httpClient.post("bi", { filtros });
  }

  async saveBi(bi: any) {
    await this.httpClient.post("bi/salvar", bi);
  }

  async deleteBi(uuid: string) {
    await this.httpClient.delete(`bi/${uuid}`);
  }

  async montar(uuid: string) {
    return await this.httpClient.get(`bi/${uuid}/montar`);
  }
}
