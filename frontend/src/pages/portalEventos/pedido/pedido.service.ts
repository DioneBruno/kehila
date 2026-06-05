import type { AuthHttp } from "src/@modules/auth/auth.http";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { LoginHttp } from "src/@modules/auth/login.http";
import type { PedidoHttp } from "src/@modules/portalEventos/pedido.http";
import { useAuthStore } from "src/stores/auth";
import { usePedidoStore } from "src/stores/pedido";
import { inject } from "vue";

export class PedidoService {
  private pedidoHttp: PedidoHttp = inject("pedidoHttp") as PedidoHttp;
  private authHttp: AuthHttp = inject("authHttp") as AuthHttp;
  private loginHttp: LoginHttp = inject("loginHttp") as LoginHttp;
  private $authStore = useAuthStore();
  private $pedidoStore = usePedidoStore();

  constructor() {}

  async verificaUsuario() {
    const authCookies = new AuthCookiesQuasar();
    const token = authCookies.getToken();
    if (!token) return;
    const response = await this.authHttp.me();
    this.$authStore.setUser(response.user);
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
    await this.pedidoHttp.criarPedido(input);
    await this.listarPedidos(input.eventoUuid);
  }

  async listarPedidos(eventoUuid: string) {
    const response = await this.pedidoHttp.listarPedidos(eventoUuid);
    const pedido = response.data.find((item: any) => item.status === "pendente");
    if (pedido) this.buscarPedido(pedido.uuid);
    return response;
  }

  async buscarPedido(pedidoUuid: string) {
    const response = await this.pedidoHttp.buscarPedido(pedidoUuid);
    this.$pedidoStore.setPedido(response);
    return response;
  }

  async gerarCobranca(input: any) {
    const response = await this.pedidoHttp.gerarCobranca(input);
    return response;
  }

  async editarFormIngresso(ingresso: any) {
    const input = {
      pedidoUuid: this.$pedidoStore.$state.pedido.uuid,
      ingressoUuid: ingresso.uuid,
      pessoaNome: ingresso.pessoaNome,
      pessoaDocumento: ingresso.pessoaDocumento,
      pessoaEmail: ingresso.pessoaEmail,
      pessoaTelefone: ingresso.pessoaTelefone,
      pessoaUf: ingresso.pessoaUf,
      pessoaCidade: ingresso.pessoaCidade,
    };
    const response = await this.pedidoHttp.editarFormIngresso(input);
    await this.buscarPedido(this.$pedidoStore.$state.pedido.uuid);
    return response;
  }
}
