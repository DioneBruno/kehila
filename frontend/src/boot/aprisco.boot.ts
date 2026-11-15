import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { ApriscoHttp } from "src/@modules/aprisco/aprisco.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("apriscoHttp", new ApriscoHttp(axiosAdapter));
});
