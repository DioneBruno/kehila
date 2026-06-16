import type HttpClient from "../http/httpClient.interface";

export type CriarDominioInput = {
  domain: string;
  active?: boolean;
};

export type EditarDominioInput = {
  domain?: string;
  active?: boolean;
};

export class DominioHttp {
  constructor(readonly http: HttpClient) {}

  async listar() {
    return this.http.get("empresa/dominios");
  }

  async criar(input: CriarDominioInput) {
    return this.http.post("empresa/dominios", input);
  }

  async editar(uuid: string, input: EditarDominioInput) {
    return this.http.put(`empresa/dominios/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`empresa/dominios/${uuid}`);
  }
}
