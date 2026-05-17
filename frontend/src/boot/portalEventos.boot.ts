import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { EventosHttp } from "src/@modules/portalEventos/eventos.http";
import { LotesHttp } from "src/@modules/portalEventos/lotes.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("eventosHttp", new EventosHttp(axiosAdapter));
  app.provide("lotesHttp", new LotesHttp(axiosAdapter));
});
