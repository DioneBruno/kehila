import type HttpClient from "../http/httpClient.interface";

export type Membro = {
  uuid: string;
  nome: string | null;
  ativo: boolean;
  membro: boolean;
  batizado: boolean;
  transferido: boolean;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  estadoCivil: string | null;
  dataNascimento: string | null;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  meta: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type MembroInput = {
  nome: string;
  ativo?: boolean;
  membro?: boolean;
  batizado?: boolean;
  transferido?: boolean;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  estadoCivil?: string | null;
  dataNascimento?: string | null;
  enderecoCep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
  meta?: Record<string, any>;
};

export class MembresiaHttp {
  constructor(readonly http: HttpClient) {}

  async listar(): Promise<{ data: Membro[] }> {
    return this.http.get("membros");
  }

  async buscarPorUuid(uuid: string): Promise<{ data: Membro }> {
    return this.http.get(`membros/${uuid}`);
  }

  async incluir(input: MembroInput): Promise<{ data: { uuid: string } }> {
    return this.http.post("membros", input);
  }

  async alterar(uuid: string, input: Partial<MembroInput>) {
    return this.http.put(`membros/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`membros/${uuid}`);
  }
}
