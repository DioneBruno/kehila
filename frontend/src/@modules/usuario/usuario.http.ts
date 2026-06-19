import type HttpClient from "../http/httpClient.interface";

export type CriarUsuarioInput = {
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  password?: string;
  position?: string;
  roles?: string[];
};

export type EditarUsuarioInput = Partial<CriarUsuarioInput> & {
  isAccepted?: boolean;
};

export class UsuarioHttp {
  constructor(readonly http: HttpClient) {}

  async listar(params?: { busca?: string; pagina?: number; porPagina?: number }) {
    const query = new URLSearchParams();
    if (params?.busca) query.set("busca", params.busca);
    if (params?.pagina) query.set("pagina", String(params.pagina));
    if (params?.porPagina) query.set("porPagina", String(params.porPagina));
    const qs = query.toString();
    return this.http.get(`usuarios${qs ? `?${qs}` : ""}`);
  }

  async buscarPorUuid(uuid: string) {
    return this.http.get(`usuarios/${uuid}`);
  }

  async criar(input: CriarUsuarioInput) {
    return this.http.post("usuarios", input);
  }

  async editar(uuid: string, input: EditarUsuarioInput) {
    return this.http.put(`usuarios/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`usuarios/${uuid}`);
  }
}
