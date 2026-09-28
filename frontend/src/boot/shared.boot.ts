import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { PublicHttp } from "src/@modules/shared/public.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("publicHttp", new PublicHttp(axiosAdapter));
});
