import type HttpClient from "../http/httpClient.interface";
import { formDataImagemLogin, type LayoutForm } from "src/components/empresaLayout";

export type EditarEmpresaInput = {
  name?: string | undefined;
  commercialName?: string | undefined;
  fantasyName?: string | undefined;
  stateRegistration?: string | undefined;
  cpfCnpj?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  address?: Record<string, unknown> | undefined;
  uf?: string | undefined;
  layout?: LayoutForm | undefined;
};

export class EmpresaHttp {
  constructor(readonly http: HttpClient) {}

  async buscar() {
    return this.http.get("empresa");
  }

  async editar(input: EditarEmpresaInput) {
    return this.http.put("empresa", input);
  }

  async enviarImagemLogin(arquivo: File) {
    return this.http.post("empresa/layout/imagem-login", formDataImagemLogin(arquivo), { headers: { "Content-Type": "multipart/form-data" } });
  }

  async removerImagemLogin() {
    return this.http.delete("empresa/layout/imagem-login");
  }
}
