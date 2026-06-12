import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { ContaBancariaHttp } from "src/@modules/financeiro/contaBancaria.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("contaBancariaHttp", new ContaBancariaHttp(axiosAdapter));
});
