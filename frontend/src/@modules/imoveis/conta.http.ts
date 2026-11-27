import type HttpClient from "../http/httpClient.interface";

export type ContaTipo = "encargo" | "despesa" | "guia";
export type ContaEsfera = "municipal" | "estadual" | "federal";
export type ContaResponsavel = "proprietario" | "inquilino";
export type ContaSituacao = "a_pagar" | "vencida" | "paga";
export type ContaAnexoTipo = "documento" | "comprovante";

export type Conta = {
  uuid: string;
  tipo: ContaTipo;
  categoria: string;
  esfera: ContaEsfera | null;
  descricao: string | null;
  proprietarioUuid: string;
  proprietarioNome: string;
  imovelUuid: string | null;
  imovelIdentificacao: string | null;
  contratoUuid: string | null;
  contratoNumero: string | null;
  inquilinoNome: string | null;
  responsavel: ContaResponsavel;
  competencia: string | null;
  vencimento: string;
  valor: number;
  pagoEm: string | null;
  valorPago: number | null;
  fornecedor: string | null;
  documentoNumero: string | null;
  grupoUuid: string | null;
  parcelaNumero: number | null;
  parcelaTotal: number | null;
  observacoes: string | null;
  situacao: ContaSituacao;
  createdAt: string;
};

export type ContaAnexo = {
  uuid: string;
  tipo: ContaAnexoTipo;
  nomeArquivo: string;
  contentType: string;
  tamanho: number;
  createdAt: string;
};

export type ContaParcela = {
  uuid: string;
  parcelaNumero: number;
  vencimento: string;
  situacao: ContaSituacao;
};

export type ContaDetalhe = Conta & { anexos: ContaAnexo[]; parcelas: ContaParcela[] };

/** Campos de uma conta. `pagoEm`/`valorPago` só valem na inclusão (conta já nasce paga). */
export type ContaInput = {
  tipo: ContaTipo;
  categoria: string;
  esfera?: ContaEsfera | null;
  descricao?: string | null;
  proprietarioUuid?: string | null;
  imovelUuid?: string | null;
  contratoUuid?: string | null;
  responsavel?: ContaResponsavel;
  competencia?: string | null;
  vencimento: string;
  valor: number;
  fornecedor?: string | null;
  documentoNumero?: string | null;
  observacoes?: string | null;
  pagoEm?: string | null;
  valorPago?: number | null;
};

export type ContaEditavelInput = Partial<Omit<ContaInput, "pagoEm" | "valorPago">>;

export type GerarParcelasInput = Omit<
  ContaInput,
  "vencimento" | "valor" | "pagoEm" | "valorPago"
> & {
  primeiroVencimento: string;
  valorParcela: number;
  quantidade: number;
};

export type ListarContasFiltro = {
  tipo?: ContaTipo | undefined;
  categoria?: string | undefined;
  proprietarioUuid?: string | undefined;
  imovelUuid?: string | undefined;
  contratoUuid?: string | undefined;
  situacao?: ContaSituacao | undefined;
  responsavel?: ContaResponsavel | undefined;
  vencimentoDe?: string | undefined;
  vencimentoAte?: string | undefined;
  busca?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
};

export type AgendaFiltro = {
  proprietarioUuid?: string | undefined;
  imovelUuid?: string | undefined;
  tipo?: ContaTipo | undefined;
};

export type GrupoAgenda = { total: number; soma: number; contas: Conta[] };
export type AgendaContas = {
  vencidas: GrupoAgenda;
  proximos7: GrupoAgenda;
  proximos30: GrupoAgenda;
};

export type ContasLista = {
  success: boolean;
  data: Conta[];
  meta: { total: number; totalValor: number; totalPago: number };
};

export class ContaHttp {
  constructor(readonly http: HttpClient) {}

  async listar(filtro: ListarContasFiltro = {}): Promise<ContasLista> {
    return this.http.get("imoveis/contas", { params: filtro });
  }

  async buscar(uuid: string): Promise<{ data: ContaDetalhe }> {
    return this.http.get(`imoveis/contas/${uuid}`);
  }

  async incluir(input: ContaInput): Promise<{ data: { uuid: string } }> {
    return this.http.post("imoveis/contas", input);
  }

  async gerarParcelas(
    input: GerarParcelasInput,
  ): Promise<{ data: { uuids: string[]; grupoUuid: string } }> {
    return this.http.post("imoveis/contas/parcelas", input);
  }

  async alterar(uuid: string, input: ContaEditavelInput) {
    return this.http.patch(`imoveis/contas/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`imoveis/contas/${uuid}`);
  }

  async registrarPagamento(uuid: string, input: { pagoEm: string; valorPago?: number | null }) {
    return this.http.post(`imoveis/contas/${uuid}/pagamento`, input);
  }

  async desfazerPagamento(uuid: string) {
    return this.http.delete(`imoveis/contas/${uuid}/pagamento`);
  }

  async enviarAnexo(
    uuid: string,
    arquivo: File,
    tipo: ContaAnexoTipo,
  ): Promise<{ data: { uuid: string } }> {
    const form = new FormData();
    form.append("tipo", tipo);
    form.append("arquivo", arquivo);
    return this.http.post(`imoveis/contas/${uuid}/anexos`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async urlAnexo(
    uuid: string,
    anexoUuid: string,
  ): Promise<{ data: { url: string; nomeArquivo: string } }> {
    return this.http.get(`imoveis/contas/${uuid}/anexos/${anexoUuid}/url`);
  }

  async removerAnexo(uuid: string, anexoUuid: string) {
    return this.http.delete(`imoveis/contas/${uuid}/anexos/${anexoUuid}`);
  }

  async agenda(filtro: AgendaFiltro = {}): Promise<{ data: AgendaContas }> {
    return this.http.get("imoveis/contas/agenda", { params: filtro });
  }
}
