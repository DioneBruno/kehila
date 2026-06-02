import type { AuthHttp } from "src/@modules/auth/auth.http";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { PedidoHttp } from "src/@modules/portalEventos/pedido.http";
import { usePedidoStore } from "src/stores/pedido";
import { inject } from "vue";

export class PedidoService {
  private pedidoHttp: PedidoHttp = inject("pedidoHttp") as PedidoHttp;
  private authHttp: AuthHttp = inject("authHttp") as AuthHttp;
  private $pedidoStore = usePedidoStore();

  constructor() {}

  async verificaUsuario() {
    const authCookies = new AuthCookiesQuasar();
    const token = authCookies.getToken();
    if (!token) return;
    const response = await this.authHttp.me();
    return response;
  }

  async buscaEvento(eventoUuid: string) {
    const response = await this.pedidoHttp.buscaEvento(eventoUuid);
    this.$pedidoStore.setEvento(response);
  }

  async cadastrarUsuario(usuario: any) {
    const authCookies = new AuthCookiesQuasar();
    const response = await this.pedidoHttp.cadastrarUsuario(usuario);
    authCookies.setToken(response.token);
    // authCookies.setRefreshToken(response.refreshToken);
    return response;
  }
}
