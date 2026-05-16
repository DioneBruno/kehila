import { verify, type JwtPayload } from "jsonwebtoken";
import { ApiError } from "./apiError";

const segredo = process.env.AUTH_JWT_SECRET ?? "404991d8-3ee3-49ee-96dd-b12122026af4";

export class ApiJwt {
  static tokenDecoding(token: string): any {
    try {
      const payload = verify(token, segredo) as JwtPayload;
      return { ...payload };
    } catch {
      throw new ApiError("Token expirado ou inválido", 401);
    }
  }
}
