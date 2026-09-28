import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class LayoutQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarLayoutCompanyUuid(companyUuid: string): Promise<any> {
    const [companyModel] = await this.connectionHub.database.query(`SELECT uuid, layout FROM auth_companies WHERE uuid = $1`, [companyUuid]);
    if (!companyModel) throw new ApiError("Empresa não encontrada", 400);
    const layout = companyModel.layout;
    return {
      telaLogin: {
        titulo: layout?.telaLogin?.titulo ?? "Kehila",
        subTitulo: layout?.telaLogin?.subTitulo ?? "Bem-vindo",
      },
      header: {
        titulo: layout?.header?.titulo ?? "Kehila",
        subTitulo: layout?.header?.subTitulo ?? "",
      },
    };
  }
}
