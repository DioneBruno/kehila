import type HttpClient from "../http/httpClient.interface";

export type CriarEventoInput = {
  titulo: string;
  descricao?: string;
  bannerUrl?: string;
  dataInicio: string;
  dataFim?: string;
  capacidadeTotal?: number;
  localNome?: string;
  localEndereco?: string;
  localLat?: number;
  localLng?: number;
  online?: boolean;
  linkOnline?: string;
  suporteEmail?: string;
  suporteTelefone?: string;
};

export class EventosHttp {
  constructor(readonly http: HttpClient) {}

  async listar(params?: { status?: string; busca?: string; pagina?: number; porPagina?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.busca) query.set("busca", params.busca);
    if (params?.pagina) query.set("pagina", String(params.pagina));
    if (params?.porPagina) query.set("porPagina", String(params.porPagina));
    const qs = query.toString();
    return this.http.get(`eventos${qs ? `?${qs}` : ""}`);
  }

  async buscarPorUuid(uuid: string) {
    return this.http.get(`eventos/${uuid}`);
  }

  async criar(input: CriarEventoInput) {
    return this.http.post("eventos", input);
  }

  async editar(uuid: string, input: Partial<CriarEventoInput>) {
    return this.http.put(`eventos/${uuid}`, input);
  }

  async publicar(uuid: string) {
    return this.http.patch(`eventos/${uuid}/publicar`, {});
  }

  async cancelar(uuid: string) {
    return this.http.patch(`eventos/${uuid}/cancelar`, {});
  }

  async encerrar(uuid: string) {
    return this.http.patch(`eventos/${uuid}/encerrar`, {});
  }
}
