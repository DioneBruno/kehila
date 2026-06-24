import { useQuasar } from "quasar";
import type { AuthHttp, EditarPerfilInput } from "src/@modules/auth/auth.http";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { LoginHttp } from "src/@modules/auth/login.http";
import type { CartaoHttp } from "src/@modules/financeiro/cartao.http";
import type { PedidoHttp } from "src/@modules/portalEventos/pedido.http";
import { useAuthStore } from "src/stores/auth";
import { usePedidoStore } from "src/stores/pedido";
import { inject } from "vue";

export class PedidoService {
  private $q = useQuasar();
  private pedidoHttp: PedidoHttp = inject("pedidoHttp") as PedidoHttp;
  private authHttp: AuthHttp = inject("authHttp") as AuthHttp;
  private loginHttp: LoginHttp = inject("loginHttp") as LoginHttp;
  private $authStore = useAuthStore();
  private $pedidoStore = usePedidoStore();
  private cartaoHttp: CartaoHttp = inject("cartaoHttp") as CartaoHttp;

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
    return response;
  }

  async loginUsuario(credentials: { email: string; senha: string }) {
    const authCookies = new AuthCookiesQuasar();
    const response = await this.loginHttp.tokenGenerate(credentials);
    authCookies.setToken(response.token);
    return response;
  }

  async gerarCodigoLogin(username: string) {
    try {
      this.$q.loading.show();
      return await this.loginHttp.randomCodeGenerate({ username });
    } catch (error) {
    } finally {
      this.$q.loading.hide();
    }
  }

  async validarCodigoLogin(input: { username: string; code: string; companyUuid: string }) {
    try {
      this.$q.loading.show();
      const authCookies = new AuthCookiesQuasar();
      const response = await this.loginHttp.randomCodeValidate(input);
      authCookies.setToken(response.token);
      return response;
    } catch (error) {
    } finally {
      this.$q.loading.hide();
    }
  }

  async criarPedido() {
    const input = {
      eventoUuid: this.$pedidoStore.$state.evento.uuid,
      pedido: this.$pedidoStore.$state.pedido.itens,
    };
    const response = await this.pedidoHttp.criarPedido(input);
    await this.buscarPedido(response.data.uuid);
  }

  async listarPedidos(eventoUuid: string) {
    const authCookies = new AuthCookiesQuasar();
    const token = authCookies.getToken();
    if (!token) return;
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
    try {
      this.$q.loading.show();
      await this.pedidoHttp.gerarCobranca(input);
      await this.buscarPedido(this.$pedidoStore.$state.pedido.uuid);
    } catch (error) {
      console.log(error);
    } finally {
      this.$q.loading.hide();
    }
  }

  async incluirCartao(input: any) {
    try {
      this.$q.loading.show();
      const [mesVencimento, anoVencimento] = input.validade.split("/");
      const payload = {
        nomeNoCartao: input.nome,
        numeroCartao: input.numero,
        mesVencimento,
        anoVencimento,
        codigoSeguranca: input.cvv,
      };
      await this.cartaoHttp.incluirCartao(payload);
      // await this.buscarPedido(this.$pedidoStore.$state.pedido.uuid);
    } catch (error) {
      console.error(error);
    } finally {
      this.$q.loading.hide();
    }
  }

  async removerCartao(cartaoUuid: string) {
    try {
      this.$q.loading.show();
      await this.cartaoHttp.removerCartao(cartaoUuid);
      await this.verificaUsuario();
    } catch (error) {
      console.error(error);
    } finally {
      this.$q.loading.hide();
    }
  }

  async editarFormIngresso(ingresso: any) {
    const input = {
      pedidoUuid: this.$pedidoStore.$state.pedido.uuid,
      ingressoUuid: ingresso.uuid,
      pessoaNome: ingresso.pessoaNome,
      pessoaDocumento: ingresso.pessoaDocumento,
      pessoaEmail: ingresso.pessoaEmail,
      pessoaTelefone: ingresso.pessoaTelefone,
      pessoaPais: ingresso.pessoaPais,
      pessoaUf: ingresso.pessoaUf,
      pessoaCidade: ingresso.pessoaCidade,
      formData: ingresso.formData,
    };
    await this.pedidoHttp.editarFormIngresso(input);
    ingresso.formDataValido = true;
    await this.buscarPedido(this.$pedidoStore.$state.pedido.uuid);
  }

  async editarPerfil(input: EditarPerfilInput) {
    try {
      this.$q.loading.show();
      const response = await this.authHttp.editarPerfil(input);
      this.$authStore.setUser({ ...this.$authStore.$state.user, ...response.user });
      return response;
    } finally {
      this.$q.loading.hide();
    }
  }

  async cancelarPedido(pedidoUuid: string) {
    try {
      this.$q.loading.show();
      await this.pedidoHttp.cancelarPedido(pedidoUuid);
      if (this.$pedidoStore.$state.pedido.uuid === pedidoUuid) {
        this.$pedidoStore.$patch((state) => {
          state.pedido = { uuid: "", etapa: 1, itens: [], ingressos: [], status: "" };
        });
      }
    } catch (error) {
    } finally {
      this.$q.loading.hide();
    }
  }
}
