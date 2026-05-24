import type { PedidoHttp } from "src/@modules/portalEventos/pedido.http";
import { inject } from "vue";

export class PedidoService {
  private pedidoHttp: PedidoHttp = inject("pedidoHttp") as PedidoHttp;
  constructor() {}

  async buscaEvento(eventoUuid: string) {
    return this.pedidoHttp.buscaEvento(eventoUuid);
  }
}
