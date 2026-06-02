import type { AuthHttp } from "src/@modules/auth/auth.http";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { LoginHttp } from "src/@modules/auth/login.http";
import type { PedidoHttp } from "src/@modules/portalEventos/pedido.http";
import { usePedidoStore } from "src/stores/pedido";
import { inject } from "vue";

export class PedidoService {
  private pedidoHttp: PedidoHttp = inject("pedidoHttp") as PedidoHttp;
  private authHttp: AuthHttp = inject("authHttp") as AuthHttp;
  private loginHttp: LoginHttp = inject("loginHttp") as LoginHttp;
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

  async cadastrarUsuario(user: any) {
    const authCookies = new AuthCookiesQuasar();
    const response = await this.pedidoHttp.cadastrarUsuario(user);
    authCookies.setToken(response.token);
    // authCookies.setRefreshToken(response.refreshToken);
    return response;
  }

  async loginUsuario(credentials: { email: string; senha: string }) {
    const authCookies = new AuthCookiesQuasar();
    const response = await this.loginHttp.tokenGenerate(credentials);
    authCookies.setToken(response.token);
    return response;
  }

  async criarPedido() {
    const input = {
      eventoUuid: this.$pedidoStore.$state.evento.uuid,
      pedido: this.$pedidoStore.$state.pedido.itens,
    };
    const response = await this.pedidoHttp.criarPedido(input);
    // this.$pedidoStore.setPedido(response);
  }
}
