import { boot } from "quasar/wrappers";
import { LoginHttp } from "src/@modules/auth/login.http";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { AuthHttp } from "src/@modules/auth/auth.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  const authHttp = new AuthHttp(axiosAdapter);
  app.provide("authHttp", authHttp);

  const loginHttp = new LoginHttp(axiosAdapter);
  app.provide("loginHttp", loginHttp);
});
