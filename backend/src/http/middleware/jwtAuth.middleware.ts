import { Injectable, NestMiddleware } from "@nestjs/common";
import { ApiError } from "src/@modules/shared/apiError";
import { ApiJwt } from "src/@modules/shared/apiJwt";

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void): void {
    const authHeader = req.headers["authorization"] as string;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError("Token de autenticação não informado", 401);
    }

    const token = authHeader.slice(7);
    const payload = ApiJwt.tokenDecoding(token);

    req["userUuid"] = payload.user?.uuid;
    req["userName"] = payload.user?.name;
    req["companyUuid"] = payload.company?.uuid;

    next();
  }
}
