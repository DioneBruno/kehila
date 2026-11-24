import type HttpClient from "../http/httpClient.interface";
import type { EnderecoInput, ListaPaginada } from "./pessoa.http";

export type ImovelTipo =
  | "casa"
  | "apartamento"
  | "sala_comercial"
  | "loja"
  | "galpao"
  | "terreno"
  | "outro";
export type ImovelFinalidade = "residencial" | "comercial";
export type ImovelSituacao = "livre" | "alugado" | "reforma" | "inativo";

export type Imovel = {
  uuid: string;
  proprietarioUuid: string;
  proprietarioNome: string;
  identificacao: string;
  tipo: ImovelTipo;
  finalidade: ImovelFinalidade;
  enderecoCep: string | null;
  enderecoLogradouro: string | null;
  enderecoNumero: string | null;
  enderecoComplemento: string | null;
  enderecoBairro: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  inscricaoIptu: string | null;
  matricula: string | null;
  cartorio: string | null;
  areaM2: number | null;
  situacao: ImovelSituacao;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContratoVigenteResumo = {
  uuid: string;
  inquilinoNome: string;
  valorAluguel: number;
  inicio: string;
  fim: string;
};

export type ImovelDetalhe = Imovel & { contratoVigente: ContratoVigenteResumo | null };

export type ImovelInput = {
  proprietarioUuid: string;
  identificacao: string;
  tipo: ImovelTipo;
  finalidade: ImovelFinalidade;
  endereco?: EnderecoInput;
  inscricaoIptu?: string | null;
  matricula?: string | null;
  cartorio?: string | null;
  areaM2?: number | null;
  observacoes?: string | null;
  /** Só aceita na alteração. */
  situacao?: ImovelSituacao;
};

export type ListarImoveisFiltro = {
  proprietarioUuid?: string | undefined;
  situacao?: ImovelSituacao | undefined;
  busca?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
};

export class ImovelHttp {
  constructor(readonly http: HttpClient) {}

  async listar(filtro: ListarImoveisFiltro = {}): Promise<ListaPaginada<Imovel>> {
    return this.http.get("imoveis/imoveis", { params: filtro });
  }

  async buscarPorUuid(uuid: string): Promise<{ data: ImovelDetalhe }> {
    return this.http.get(`imoveis/imoveis/${uuid}`);
  }

  async incluir(input: Omit<ImovelInput, "situacao">): Promise<{ data: { uuid: string } }> {
    return this.http.post("imoveis/imoveis", input);
  }

  async alterar(uuid: string, input: Partial<ImovelInput>) {
    return this.http.patch(`imoveis/imoveis/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`imoveis/imoveis/${uuid}`);
  }
}
