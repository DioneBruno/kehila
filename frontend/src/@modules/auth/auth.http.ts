import type HttpClient from "../http/httpClient.interface";

export type EditarPerfilInput = {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  enderecoNumero: string;
  cidade: string;
  uf: string;
};

export class AuthHttp {
  constructor(readonly http: HttpClient) {}

  async me() {
    return this.http.post(`auth/me`, {});
  }

  async editarPerfil(input: EditarPerfilInput) {
    return this.http.post(`auth/editar-perfil`, input);
  }
}
