import type HttpClient from "../http/httpClient.interface";
import type { ListaPaginada } from "./pessoa.http";

export type IndiceReajuste = "IGPM" | "IPCA" | "INPC" | "IGPDI" | "nenhum";
export type GarantiaTipo =
  | "fiador"
  | "caucao"
  | "seguro_fianca"
  | "titulo_capitalizacao"
  | "nenhuma";
export type ContratoStatus = "vigente" | "encerrado" | "rescindido";
export type ContratoEventoTipo = "renovacao" | "aditivo" | "encerramento" | "rescisao";

export type Contrato = {
  uuid: string;
  numero: string | null;
  imovelUuid: string;
  imovelIdentificacao: string;
  proprietarioUuid: string;
  proprietarioNome: string;
  inquilinoUuid: string;
  inquilinoNome: string;
  fiadorUuid: string | null;
  fiadorNome: string | null;
  inicio: string;
  fim: string;
  valorAluguel: number;
  diaVencimento: number;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
  multaAtrasoPct: number;
  jurosMesPct: number;
  descontoPontualidadePct: number | null;
  multaRescisoriaMeses: number | null;
  garantiaTipo: GarantiaTipo;
  garantiaValor: number | null;
  status: ContratoStatus;
  encerradoEm: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContratoEvento = {
  uuid: string;
  contratoUuid: string;
  tipo: ContratoEventoTipo;
  data: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  fimAnterior: string | null;
  fimNovo: string | null;
  criadoPorUuid: string | null;
  criadoPorNome: string | null;
  createdAt: string;
};

/** Campos editáveis depois de criado. fim, valorAluguel, status, imóvel e inquilino só mudam por evento. */
export type ContratoEditavelInput = {
  numero?: string | null;
  inicio?: string;
  diaVencimento?: number;
  indiceReajuste?: IndiceReajuste;
  mesReajuste?: number | null;
  multaAtrasoPct?: number;
  jurosMesPct?: number;
  descontoPontualidadePct?: number | null;
  multaRescisoriaMeses?: number | null;
  garantiaTipo?: GarantiaTipo;
  garantiaValor?: number | null;
  fiadorUuid?: string | null;
  observacoes?: string | null;
};

export type ContratoInput = ContratoEditavelInput & {
  imovelUuid: string;
  inquilinoUuid: string;
  inicio: string;
  fim: string;
  valorAluguel: number;
};

export type ContratoEventoInput = {
  tipo: ContratoEventoTipo;
  data: string;
  descricao: string;
  valorNovo?: number | null;
  fimNovo?: string | null;
};

export type ListarContratosFiltro = {
  proprietarioUuid?: string | undefined;
  imovelUuid?: string | undefined;
  inquilinoUuid?: string | undefined;
  status?: ContratoStatus | undefined;
  busca?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
};

export class ContratoHttp {
  constructor(readonly http: HttpClient) {}

  async listar(filtro: ListarContratosFiltro = {}): Promise<ListaPaginada<Contrato>> {
    return this.http.get("imoveis/contratos", { params: filtro });
  }

  async buscarPorUuid(uuid: string): Promise<{ data: Contrato }> {
    return this.http.get(`imoveis/contratos/${uuid}`);
  }

  async incluir(input: ContratoInput): Promise<{ data: { uuid: string } }> {
    return this.http.post("imoveis/contratos", input);
  }

  async alterar(uuid: string, input: ContratoEditavelInput) {
    return this.http.patch(`imoveis/contratos/${uuid}`, input);
  }

  async listarEventos(uuid: string): Promise<{ data: ContratoEvento[] }> {
    return this.http.get(`imoveis/contratos/${uuid}/eventos`);
  }

  async registrarEvento(
    uuid: string,
    input: ContratoEventoInput,
  ): Promise<{ data: { uuid: string } }> {
    return this.http.post(`imoveis/contratos/${uuid}/eventos`, input);
  }
}
