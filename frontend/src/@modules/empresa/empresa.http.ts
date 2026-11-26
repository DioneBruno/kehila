import type HttpClient from "../http/httpClient.interface";
import type { LayoutForm } from "src/components/empresaLayout";

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
}
