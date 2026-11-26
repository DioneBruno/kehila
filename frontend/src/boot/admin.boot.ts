import { boot } from "quasar/wrappers";
import { AdminEmpresaHttp } from "src/@modules/admin/empresa.http";
import AxiosAdapter from "src/@modules/http/axiosAdapter";

export default boot(({ app }) => {
  app.provide("adminEmpresaHttp", new AdminEmpresaHttp(new AxiosAdapter()));
});
