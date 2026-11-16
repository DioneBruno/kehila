import { Injectable, NestMiddleware } from "@nestjs/common";
import { ApiError } from "src/@modules/shared/apiError";

/**
 * Perfis de acesso (lidos do token já validado pelo JwtAuthMiddleware):
 * - admin: position === "admin" (mesmo critério usado pelo menu do frontend).
 * - externo: usuário criado pelo portal de eventos (role "usuario-externo") sem cargo.
 * - interno: qualquer usuário que não seja externo (ex.: líderes de aprisco).
 */
export function ehAdmin(req: any): boolean {
  return req?.userPosition === "admin";
}

export function ehExterno(req: any): boolean {
  const roles: string[] = Array.isArray(req?.userRoles) ? req.userRoles : [];
  return !req?.userPosition && roles.includes("usuario-externo");
}

export function exigirAdmin(req: any): void {
  if (!ehAdmin(req)) throw new ApiError("Acesso permitido apenas para administradores", 403);
}

export function exigirInterno(req: any): void {
  if (ehExterno(req)) throw new ApiError("Acesso não permitido para este usuário", 403);
}

/** Deve ser aplicado depois do JwtAuthMiddleware. */
@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void): void {
    exigirAdmin(req);
    next();
  }
}

/** Deve ser aplicado depois do JwtAuthMiddleware. */
@Injectable()
export class InternoMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void): void {
    exigirInterno(req);
    next();
  }
}
