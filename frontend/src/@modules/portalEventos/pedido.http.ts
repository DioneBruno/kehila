import type HttpClient from "../http/httpClient.interface";

export class PedidoHttp {
  constructor(readonly http: HttpClient) {}

  async buscaEvento(eventoUuid: string) {
    return this.http.post(`publico/eventos/${eventoUuid}`, {});
  }
}
