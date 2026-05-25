import type { PedidoHttp } from "src/@modules/portalEventos/pedido.http";
import { usePedidoStore } from "src/stores/pedido";
import { inject } from "vue";

export class PedidoService {
  private pedidoHttp: PedidoHttp = inject("pedidoHttp") as PedidoHttp;
  private $pedidoStore = usePedidoStore();

  constructor() {}

  async buscaEvento(eventoUuid: string) {
    const response = await this.pedidoHttp.buscaEvento(eventoUuid);
    this.$pedidoStore.setEvento(response);
  }
}
