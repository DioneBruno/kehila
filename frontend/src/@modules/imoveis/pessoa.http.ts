import type HttpClient from "../http/httpClient.interface";

export type PessoaTipo = "PF" | "PJ";
export type PessoaPapel = "proprietario" | "inquilino" | "fiador";

export type Pessoa = {
  uuid: string;
  tipo: PessoaTipo;
  documento: string;
  nome: string;
  nomeFantasia: string | null;
  rgIe: string | null;
  email: string | null;
  telefone: string | null;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  observacoes: string | null;
  ehProprietario: boolean;
  ehInquilino: boolean;
  ehFiador: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EnderecoInput = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export type PessoaInput = {
  tipo: PessoaTipo;
  documento: string;
  nome: string;
  nomeFantasia?: string | null;
  rgIe?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: EnderecoInput;
  observacoes?: string | null;
  ehProprietario?: boolean;
  ehInquilino?: boolean;
  ehFiador?: boolean;
};

export type ListarPessoasFiltro = {
  papel?: PessoaPapel | undefined;
  busca?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
};

export type ListaPaginada<T> = { success: boolean; data: T[]; meta: { total: number } };

export class PessoaHttp {
  constructor(readonly http: HttpClient) {}

  async listar(filtro: ListarPessoasFiltro = {}): Promise<ListaPaginada<Pessoa>> {
    return this.http.get("imoveis/pessoas", { params: filtro });
  }

  async buscarPorUuid(uuid: string): Promise<{ data: Pessoa }> {
    return this.http.get(`imoveis/pessoas/${uuid}`);
  }

  async incluir(input: PessoaInput): Promise<{ data: { uuid: string } }> {
    return this.http.post("imoveis/pessoas", input);
  }

  /** `tipo` não é alterável depois de criada. */
  async alterar(uuid: string, input: Partial<Omit<PessoaInput, "tipo">>) {
    return this.http.patch(`imoveis/pessoas/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`imoveis/pessoas/${uuid}`);
  }
}
