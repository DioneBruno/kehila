import { sign, SignOptions, verify, type JwtPayload } from "jsonwebtoken";

const segredo = process.env.AUTH_JWT_SECRET ?? "404991d8-3ee3-49ee-96dd-b12122026af4";
const expiresIn = process.env.AUTH_JWT_EXPIRES_IN ?? "8h";
export class ApiJwt {
  static tokenSigning(payload: object): string {
    return sign(payload, segredo, { expiresIn: expiresIn as SignOptions["expiresIn"] });
  }

  static tokenDecoding(token: string): any {
    try {
      const payload = verify(token, segredo) as JwtPayload;
      return { ...payload };
    } catch (err) {
      console.log(token, err);
      return false;
    }
  }
}
