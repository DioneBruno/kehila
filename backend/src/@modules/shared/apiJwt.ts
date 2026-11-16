import { randomBytes } from "crypto";
import { sign, SignOptions, verify, type JwtPayload } from "jsonwebtoken";

let segredoGerado: string | null = null;

/**
 * Lê o segredo no momento do uso (e não no carregamento do módulo), para garantir
 * que o .env já foi carregado. Sem AUTH_JWT_SECRET, gera um segredo aleatório por
 * processo: o login continua funcionando, mas os tokens deixam de valer ao reiniciar.
 * Nunca usar um segredo fixo no código, pois permitiria forjar tokens.
 */
function segredo(): string {
  const configurado = process.env.AUTH_JWT_SECRET;
  if (configurado) return configurado;
  if (!segredoGerado) {
    segredoGerado = randomBytes(48).toString("hex");
    console.warn("[ApiJwt] AUTH_JWT_SECRET não configurado. Usando segredo aleatório temporário; defina AUTH_JWT_SECRET no ambiente.");
  }
  return segredoGerado;
}

export class ApiJwt {
  static tokenSigning(payload: object): string {
    const expiresIn = process.env.AUTH_JWT_EXPIRES_IN ?? "8h";
    return sign(payload, segredo(), { expiresIn: expiresIn as SignOptions["expiresIn"] });
  }

  static tokenDecoding(token: string): any {
    try {
      const payload = verify(token, segredo(), { algorithms: ["HS256"] }) as JwtPayload;
      return { ...payload };
    } catch {
      return false;
    }
  }
}
