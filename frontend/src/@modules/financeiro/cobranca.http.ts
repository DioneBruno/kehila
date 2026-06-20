import type HttpClient from "../http/httpClient.interface";

export class CobrancaHttp {
  constructor(readonly http: HttpClient) {}

  async listar(params?: { busca?: string; status?: string; pagina?: number; porPagina?: number }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set("busca", params.busca);
    if (params?.status) query.set("status", params.status);
    if (params?.pagina) query.set("pagina", String(params.pagina));
    if (params?.porPagina) query.set("porPagina", String(params.porPagina));
    const qs = query.toString();
    return this.http.get(`cobrancas${qs ? `?${qs}` : ""}`);
  }
}
