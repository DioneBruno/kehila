import type HttpClient from "../http/httpClient.interface";

export class PedidoHttp {
  constructor(readonly http: HttpClient) {}

  async buscaEvento(eventoUuid: string) {
    return this.http.post(`publico/eventos/${eventoUuid}`, {});
  }

  async cadastrarUsuario(user: any) {
    return this.http.post(`publico/eventos/novo-usuario`, user);
  }

  async criarPedido(pedido: any) {
    return this.http.post(`pedidos/criar`, pedido);
  }

  async listarPedidos(eventoUuid: string) {
    return this.http.post(`pedidos/listar`, { eventoUuid });
  }

  async buscarPedido(pedidoUuid: string) {
    return this.http.post(`pedidos/${pedidoUuid}`, {});
  }
}
