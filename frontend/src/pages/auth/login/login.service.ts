import { useQuasar } from "quasar";
import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { LoginHttp } from "src/@modules/auth/login.http";
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
      void this.$router.push({ name: "home" });
    } catch (error) {
      console.log(error);
    } finally {
      this.$q.loading.hide();
    }
  }
}
