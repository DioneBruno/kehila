import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { EmpresaHttp } from "src/@modules/empresa/empresa.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("empresaHttp", new EmpresaHttp(axiosAdapter));
});
