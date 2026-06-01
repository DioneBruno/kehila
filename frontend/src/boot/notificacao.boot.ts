import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { NotificacaoHttp } from "src/@modules/notificacao/notificacao.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  const notificacaoHttp = new NotificacaoHttp(axiosAdapter);
  app.provide("notificacaoHttp", notificacaoHttp);
});
