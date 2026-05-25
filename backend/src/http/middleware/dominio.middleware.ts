import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

@Injectable()
export class DominioMiddleware implements NestMiddleware {
  constructor(private readonly connectionHub: ConnectionHub) {}

  async use(req: any, res: any, next: (error?: any) => void): Promise<void> {
    const platform = req.headers["platform"];
    let domain = req.headers["origin"];

    if (platform === "electron") {
      domain = req.headers["tenant"];
    }

    if (platform === "site") {
      domain = req.headers["tenant"];
    }

    if (platform === "mobile") {
      domain = req.headers["tenant"];
    }

    if (!domain) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: "Tenant deve ser informado",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    //TODO: Remanejar para um local mais apropriado
    const [companyModel] = await this.connectionHub.database.query(
      `SELECT companies.uuid
      FROM auth_companies companies
        INNER JOIN auth_company_domains domains
          ON companies.uuid = domains.company_uuid
      where domains.deleted_at IS NULL
        AND domains.active = true
        AND domains.domain = $1`,
      [domain],
    );
    if (!companyModel) throw new ApiError("Empresa não encontrada para o domínio informado");
    //TODO: Remanejar para um local mais apropriado

    req["companyUuid"] = companyModel.uuid;

    next();
  }
}
