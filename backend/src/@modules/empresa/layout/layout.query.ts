import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImagemLoginUrl } from "./imagemLogin/imagemLogin";

export class LayoutQuery {
  constructor(
    readonly connectionHub: ConnectionHub,
    readonly imagemLoginUrl?: ImagemLoginUrl,
  ) {}

  async buscarLayoutCompanyUuid(companyUuid: string): Promise<any> {
    const [companyModel] = await this.connectionHub.database.query(`SELECT uuid, layout FROM auth_companies WHERE uuid = $1`, [companyUuid]);
    if (!companyModel) throw new ApiError("Empresa não encontrada", 400);
    const layout = companyModel.layout;
    return {
      telaLogin: {
        titulo: layout?.telaLogin?.titulo ?? "Kehila",
        subTitulo: layout?.telaLogin?.subTitulo ?? "Bem-vindo",
        // null = o frontend usa a imagem padrão.
        imagemUrl: (await this.imagemLoginUrl?.gerar(layout)) ?? null,
      },
      header: {
        titulo: layout?.header?.titulo ?? "Kehila",
        subTitulo: layout?.header?.subTitulo ?? "",
      },
    };
  }
}
