import { AuthCookiesQuasar } from "src/@modules/auth/authCookies.quasar";
import type { LoginHttp } from "src/@modules/auth/login.http";
import { inject } from "vue";

export class LoginService {
  private $authCookies: AuthCookiesQuasar;
  private $loginHttp = inject("loginHttp") as LoginHttp;

  constructor() {
    this.$authCookies = new AuthCookiesQuasar();
  }

  async login(input: any) {
    const response = this.$loginHttp.tokenGenerate(input);
    return response;
  }
}
