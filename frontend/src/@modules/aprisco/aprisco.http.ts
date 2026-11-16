import type HttpClient from "../http/httpClient.interface";

export type ApriscoStatus = "ativo" | "inativo";

export type Aprisco = {
  uuid: string;
  index: number;
  nome: string;
  horario: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ApriscoStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApriscoInput = {
  nome: string;
  horario?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: ApriscoStatus;
};

export type PapelIntegrante = "LIDER" | "AUXILIAR" | "ANFITRIAO" | "MEMBRO";

export type Integrante = {
  uuid: string;
  pessoaUuid: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  papel: PapelIntegrante;
  createdAt: string;
};

export type IntegranteInput = {
  pessoaUuid: string;
  papel?: PapelIntegrante;
};

export type TipoPresenca = "INTEGRANTE" | "CRIANCA" | "VISITANTE";

export type Presenca = {
  tipo: TipoPresenca;
  pessoaUuid: string | null;
  presenca: boolean;
  quantidade: number | null;
};

export type RegistrarPresencasInput = {
  /** AAAA-MM-DD */
  dataReuniao: string;
  integrantes: { pessoaUuid: string; presenca: boolean }[];
  /** null = não informado */
  criancas?: number | null;
  /** null = não informado */
  visitantes?: number | null;
};

export class ApriscoHttp {
  constructor(readonly http: HttpClient) {}

  async listar(): Promise<{ data: Aprisco[] }> {
    return this.http.get("apriscos");
  }

  /** Apriscos em que o usuário logado é LIDER */
  async listarLiderados(): Promise<{ data: Aprisco[] }> {
    return this.http.get("apriscos/liderados");
  }

  async buscarPorUuid(uuid: string): Promise<{ data: Aprisco }> {
    return this.http.get(`apriscos/${uuid}`);
  }

  async incluir(input: ApriscoInput): Promise<{ data: { uuid: string } }> {
    return this.http.post("apriscos", input);
  }

  async alterar(uuid: string, input: Partial<ApriscoInput>) {
    return this.http.put(`apriscos/${uuid}`, input);
  }

  async deletar(uuid: string) {
    return this.http.delete(`apriscos/${uuid}`);
  }

  async listarIntegrantes(uuid: string): Promise<{ data: Integrante[] }> {
    return this.http.get(`apriscos/${uuid}/integrantes`);
  }

  async vincularIntegrante(
    uuid: string,
    input: IntegranteInput,
  ): Promise<{ data: { uuid: string } }> {
    return this.http.post(`apriscos/${uuid}/integrantes`, input);
  }

  async disvincularIntegrante(uuid: string, integranteUuid: string) {
    return this.http.delete(`apriscos/${uuid}/integrantes/${integranteUuid}`);
  }

  async listarPresencas(uuid: string, dataReuniao: string): Promise<{ data: Presenca[] }> {
    return this.http.get(`apriscos/${uuid}/presencas?data=${encodeURIComponent(dataReuniao)}`);
  }

  async registrarPresencas(
    uuid: string,
    input: RegistrarPresencasInput,
  ): Promise<{ data: { uuid: string; tipo: TipoPresenca; pessoaUuid: string | null }[] }> {
    return this.http.post(`apriscos/${uuid}/presencas`, input);
  }
}
