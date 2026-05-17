import { boot } from "quasar/wrappers";
import { LoginHttp } from "src/@modules/auth/login.http";
import AxiosAdapter from "src/@modules/http/axiosAdapter";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  const loginHttp = new LoginHttp(axiosAdapter);
  app.provide("loginHttp", loginHttp);
});
