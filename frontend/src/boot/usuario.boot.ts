import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { UsuarioHttp } from "src/@modules/usuario/usuario.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("usuarioHttp", new UsuarioHttp(axiosAdapter));
});
