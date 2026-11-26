import type HttpClient from "../http/httpClient.interface";

export type EmpresaEnderecoInput = {
  cep?: string | undefined;
  logradouro?: string | undefined;
  numero?: string | undefined;
  complemento?: string | undefined;
  bairro?: string | undefined;
  cidade?: string | undefined;
};

export type EmpresaDadosInput = {
  name: string;
  cpfCnpj: string;
  commercialName?: string | undefined;
  fantasyName?: string | undefined;
  stateRegistration?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  uf?: string | undefined;
  address?: EmpresaEnderecoInput | undefined;
};

export type CadastrarEmpresaInput = {
  empresa: EmpresaDadosInput;
  dominio: string;
  modulos: string[];
  admin: {
    name: string;
    email?: string | undefined;
    cpf?: string | undefined;
    phone?: string | undefined;
    password: string;
  };
};

export type ListarEmpresasParams = {
  busca?: string | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
};

export type EmpresaResumo = {
  uuid: string;
  name: string;
  fantasyName: string | null;
  cpfCnpj: string;
  modulos: string[];
  dominios: string[];
  createdAt: string;
};

export type EmpresaDominio = { uuid: string; domain: string; active: boolean; createdAt: string };

export type EmpresaDetalhe = {
  uuid: string;
  name: string;
  commercialName: string | null;
  fantasyName: string | null;
  stateRegistration: string | null;
  cpfCnpj: string;
  email: string | null;
  phone: string | null;
  address: EmpresaEnderecoInput | null;
  uf: string | null;
  createdAt: string;
  modulos: string[];
  dominios: EmpresaDominio[];
};

export type DominioInput = { domain?: string | undefined; active?: boolean | undefined };

export type EmpresaUsuarioItem = {
  uuid: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  roles: string[];
  isAccepted: boolean;
  isVerify: boolean;
  createdAt: string;
};

export type EmpresaUsuarioDetalhe = EmpresaUsuarioItem & {
  outrasEmpresas: { uuid: string; name: string }[];
};

export type EmpresaUsuarioInput = {
  name: string;
  cpf?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  password?: string | undefined;
  position?: string | undefined;
  roles?: string[] | undefined;
  isAccepted?: boolean | undefined;
};

export class AdminEmpresaHttp {
  constructor(readonly http: HttpClient) {}

  async listar(params: ListarEmpresasParams = {}) {
    return this.http.get("admin/empresas", { params });
  }

  async detalhar(uuid: string) {
    return this.http.get(`admin/empresas/${uuid}`);
  }

  async cadastrar(input: CadastrarEmpresaInput) {
    return this.http.post("admin/empresas", input);
  }

  async editar(uuid: string, input: EmpresaDadosInput) {
    return this.http.put(`admin/empresas/${uuid}`, input);
  }

  async listarDominios(uuid: string) {
    return this.http.get(`admin/empresas/${uuid}/dominios`);
  }

  async criarDominio(uuid: string, input: DominioInput) {
    return this.http.post(`admin/empresas/${uuid}/dominios`, input);
  }

  async editarDominio(uuid: string, dominioUuid: string, input: DominioInput) {
    return this.http.put(`admin/empresas/${uuid}/dominios/${dominioUuid}`, input);
  }

  async deletarDominio(uuid: string, dominioUuid: string) {
    return this.http.delete(`admin/empresas/${uuid}/dominios/${dominioUuid}`);
  }

  async definirModulos(uuid: string, modulos: string[]) {
    return this.http.put(`admin/empresas/${uuid}/modulos`, { modulos });
  }

  async listarUsuarios(uuid: string, params: ListarEmpresasParams = {}) {
    return this.http.get(`admin/empresas/${uuid}/usuarios`, { params });
  }

  async detalharUsuario(uuid: string, usuarioUuid: string) {
    return this.http.get(`admin/empresas/${uuid}/usuarios/${usuarioUuid}`);
  }

  async criarUsuario(uuid: string, input: EmpresaUsuarioInput) {
    return this.http.post(`admin/empresas/${uuid}/usuarios`, input);
  }

  async editarUsuario(uuid: string, usuarioUuid: string, input: EmpresaUsuarioInput) {
    return this.http.put(`admin/empresas/${uuid}/usuarios/${usuarioUuid}`, input);
  }

  async deletarUsuario(uuid: string, usuarioUuid: string) {
    return this.http.delete(`admin/empresas/${uuid}/usuarios/${usuarioUuid}`);
  }
}
