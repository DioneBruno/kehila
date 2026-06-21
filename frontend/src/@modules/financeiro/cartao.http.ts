import type HttpClient from "../http/httpClient.interface";

export class CartaoHttp {
  constructor(readonly http: HttpClient) {}

  async incluirCartao(input: any) {
    return this.http.post(`cartao-credito`, input);
  }

  async removerCartao(cartaoUuid: string) {
    return this.http.delete(`cartao-credito/${cartaoUuid}`);
  }
}
