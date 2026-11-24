import { boot } from "quasar/wrappers";
import AxiosAdapter from "src/@modules/http/axiosAdapter";
import { ContratoHttp } from "src/@modules/imoveis/contrato.http";
import { ImovelHttp } from "src/@modules/imoveis/imovel.http";
import { PainelHttp } from "src/@modules/imoveis/painel.http";
import { PessoaHttp } from "src/@modules/imoveis/pessoa.http";

export default boot(({ app }) => {
  const axiosAdapter = new AxiosAdapter();

  app.provide("pessoaHttp", new PessoaHttp(axiosAdapter));
  app.provide("imovelHttp", new ImovelHttp(axiosAdapter));
  app.provide("contratoHttp", new ContratoHttp(axiosAdapter));
  app.provide("painelHttp", new PainelHttp(axiosAdapter));
});
