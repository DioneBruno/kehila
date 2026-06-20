import type HttpClient from "../http/httpClient.interface";

export class PagamentoHttp {
  constructor(readonly http: HttpClient) {}

  async listar(params?: { busca?: string; status?: string; pagina?: number; porPagina?: number }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set("busca", params.busca);
    if (params?.status) query.set("status", params.status);
    if (params?.pagina) query.set("pagina", String(params.pagina));
    if (params?.porPagina) query.set("porPagina", String(params.porPagina));
    const qs = query.toString();
    return this.http.get(`pagamentos${qs ? `?${qs}` : ""}`);
  }

  async verificarPagamento(uuid: string) {
    return this.http.post(`pagamentos/${uuid}/verificarPagamento`, {});
  }
}
