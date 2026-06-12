import type HttpClient from "../http/httpClient.interface";

export type CriarContaBancariaInput = {
  nome: string;
  bancoNumero?: string;
  agencia?: string;
  conta?: string;
  digito?: string;
  chaveApi?: string;
  status?: string;
};

export class ContaBancariaHttp {
  constructor(readonly http: HttpClient) {}

  async listar(params?: { busca?: string; status?: string; pagina?: number; porPagina?: number }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set("busca", params.busca);
    if (params?.status) query.set("status", params.status);
    if (params?.pagina) query.set("pagina", String(params.pagina));
    if (params?.porPagina) query.set("porPagina", String(params.porPagina));
    const qs = query.toString();
    return this.http.get(`contas-bancarias${qs ? `?${qs}` : ""}`);
  }

  async buscarPorUuid(uuid: string) {
    return this.http.get(`contas-bancarias/${uuid}`);
  }

  async criar(input: CriarContaBancariaInput) {
    return this.http.post("contas-bancarias", input);
  }

  async editar(uuid: string, input: Partial<CriarContaBancariaInput>) {
    return this.http.put(`contas-bancarias/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`contas-bancarias/${uuid}`);
  }
}
