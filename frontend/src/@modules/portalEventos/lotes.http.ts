import type HttpClient from "../http/httpClient.interface";

export type CriarLoteInput = {
  eventoUuid: string;
  nome: string;
  ordem?: number;
  quantidade: number;
  preco: number;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
};

export type EditarLoteInput = {
  nome: string;
  ordem: number;
  quantidade: number;
  preco: number;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
};

export type CriarTipoIngressoInput = {
  nome: string;
  descricao?: string;
  quantidade: number;
  preco: number;
  visivel?: boolean;
};

export type EditarTipoIngressoInput = {
  nome: string;
  descricao?: string;
  quantidade: number;
  preco: number;
  visivel?: boolean;
};

export class LotesHttp {
  constructor(readonly http: HttpClient) {}

  async listar(eventoUuid: string) {
    return this.http.get(`lotes?eventoUuid=${eventoUuid}`);
  }

  async criar(input: CriarLoteInput) {
    return this.http.post("lotes", input);
  }

  async editar(loteUuid: string, input: EditarLoteInput) {
    return this.http.put(`lotes/${loteUuid}`, input);
  }

  async remover(loteUuid: string) {
    return this.http.delete(`lotes/${loteUuid}`);
  }

  async criarTipo(loteUuid: string, input: CriarTipoIngressoInput) {
    return this.http.post(`lotes/${loteUuid}/tipos-ingresso`, input);
  }

  async editarTipo(loteUuid: string, tipoUuid: string, input: EditarTipoIngressoInput) {
    return this.http.put(`lotes/${loteUuid}/tipos-ingresso/${tipoUuid}`, input);
  }

  async removerTipo(loteUuid: string, tipoUuid: string) {
    return this.http.delete(`lotes/${loteUuid}/tipos-ingresso/${tipoUuid}`);
  }
}
