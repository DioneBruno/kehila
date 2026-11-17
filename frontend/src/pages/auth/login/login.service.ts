import { useQuasar } from "quasar";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { LoginHttp } from "src/@modules/auth/login.http";
import { loginComDispositivoConfiavel } from "src/boot/axios";
import { inject } from "vue";
import { useRouter } from "vue-router";

export class LoginService {
  private $authCookies: AuthCookiesQuasar;
  private $loginHttp = inject("loginHttp") as LoginHttp;
  private $q = useQuasar();
  private $router = useRouter();

  constructor() {
    this.$authCookies = new AuthCookiesQuasar();
  }

  async login(input: any) {
    try {
      this.$q.loading.show();
      const response = await this.$loginHttp.tokenGenerate(input);
      this.$authCookies.setToken(response.token);
      if (response.deviceToken) this.$authCookies.setDeviceToken(response.deviceToken);
      void this.$router.push({ name: "home" });
    } catch (error) {
      console.log(error);
    } finally {
      this.$q.loading.hide();
    }
  }

  /**
   * Entra sem senha se este navegador foi marcado como confiável.
   * Devolve `false` quando é preciso mostrar o formulário.
   */
  async loginDispositivoConfiavel(): Promise<boolean> {
    const deviceToken = this.$authCookies.getDeviceToken();
    if (!deviceToken) return false;

    const { status, data } = await loginComDispositivoConfiavel(deviceToken);
    if (status === 200 && data?.token) {
      this.$authCookies.setToken(data.token);
      if (data.deviceToken) this.$authCookies.setDeviceToken(data.deviceToken);
      void this.$router.push({ name: "home" });
      return true;
    }
    // Só esquece o dispositivo quando o servidor o recusou; erro de rede/500 mantém o token.
    if (status === 401) this.$authCookies.deleteDeviceToken();
    return false;
  }
}
