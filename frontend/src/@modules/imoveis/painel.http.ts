import type HttpClient from "../http/httpClient.interface";
import type { IndiceReajuste } from "./contrato.http";

export type ContratoResumo = {
  uuid: string;
  imovelIdentificacao: string;
  proprietarioNome: string;
  inquilinoNome: string;
  valorAluguel: number;
  fim: string;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
};

export type ImovelLivreResumo = { uuid: string; identificacao: string; proprietarioNome: string };

export type PainelImoveis = {
  vencidos: ContratoResumo[];
  vence0a30: ContratoResumo[];
  vence31a60: ContratoResumo[];
  vence61a90: ContratoResumo[];
  reajustesMes: ContratoResumo[];
  imoveisLivres: ImovelLivreResumo[];
  contasVencidas: number;
};

export class PainelHttp {
  constructor(readonly http: HttpClient) {}

  async buscar(): Promise<{ data: PainelImoveis }> {
    return this.http.get("imoveis/painel");
  }
}
