import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { MembresiaHttp } from "src/@modules/membresia/membresia.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("membresiaHttp", new MembresiaHttp(axiosAdapter));
});
