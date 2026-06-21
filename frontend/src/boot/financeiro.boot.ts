import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { ContaBancariaHttp } from "src/@modules/financeiro/contaBancaria.http";
import { CobrancaHttp } from "src/@modules/financeiro/cobranca.http";
import { PagamentoHttp } from "src/@modules/financeiro/pagamento.http";
import { CartaoHttp } from "src/@modules/financeiro/cartao.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("contaBancariaHttp", new ContaBancariaHttp(axiosAdapter));
  app.provide("cobrancaHttp", new CobrancaHttp(axiosAdapter));
  app.provide("pagamentoHttp", new PagamentoHttp(axiosAdapter));
  app.provide("cartaoHttp", new CartaoHttp(axiosAdapter));
});
