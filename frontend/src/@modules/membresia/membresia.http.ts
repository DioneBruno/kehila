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
  /** Presente no detalhe: usuário de acesso vinculado à empresa (mesmo CPF/e-mail). */
  usuarioUuid?: string | null;
};

export type CriarUsuarioMembroInput = {
  /** Opcional: sem senha, o membro define a sua em "Recuperar conta" na tela de login. */
  password?: string | undefined;
  position?: string | undefined;
  roles?: string[] | undefined;
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

export type TipoVinculo =
  | "PAI"
  | "MAE"
  | "FILHO"
  | "FILHA"
  | "CONJUGE"
  | "IRMAO"
  | "IRMA"
  | "AVO"
  | "NETO"
  | "NETA"
  | "TIO"
  | "TIA"
  | "SOBRINHO"
  | "SOBRINHA"
  | "OUTRO";

/** Lê-se: "membroVinculado é <tipo> do membro". */
export type Vinculo = {
  uuid: string;
  tipo: TipoVinculo;
  membroVinculadoUuid: string;
  membroVinculadoNome: string | null;
  createdAt: string;
};

export type VinculoInput = {
  membroVinculadoUuid: string;
  tipo: TipoVinculo;
  tipoInverso?: TipoVinculo | null;
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

  async listarVinculos(uuid: string): Promise<{ data: Vinculo[] }> {
    return this.http.get(`membros/${uuid}/vinculos`);
  }

  async vincular(uuid: string, vinculos: VinculoInput[]): Promise<{ data: { uuids: string[] } }> {
    return this.http.post(`membros/${uuid}/vinculos`, { vinculos });
  }

  async removerVinculo(uuid: string, vinculoUuid: string) {
    return this.http.delete(`membros/${uuid}/vinculos/${vinculoUuid}`);
  }

  async criarUsuario(uuid: string, input: CriarUsuarioMembroInput): Promise<{ data: { uuid: string } }> {
    return this.http.post(`membros/${uuid}/usuario`, input);
  }
}
