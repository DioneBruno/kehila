import { createHash, randomBytes } from "crypto";

/** Token cru do dispositivo: fica só no navegador do usuário. */
export function gerarDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

/** O banco guarda apenas este hash, nunca o token cru. */
export function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
