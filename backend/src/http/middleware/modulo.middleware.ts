import { Injectable, NestMiddleware } from "@nestjs/common";
import { ModuloEmpresaRepository } from "src/@modules/empresa/modulos/moduloEmpresaRepository";
import { ModuloChave } from "src/@modules/empresa/modulos/modulos";
import { ApiError } from "src/@modules/shared/apiError";
import { ConnectionCacheInterface } from "src/@modules/shared/connections/connectionCache.interface";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";


const CACHE_SEGUNDOS = 300;

async function lerCache(cache: ConnectionCacheInterface | undefined, chave: string): Promise<string[] | null> {
  if (!cache) return null;
  try {
    const salvo = await cache.findKey(chave);
    if (!salvo || salvo.modulos === undefined || salvo.modulos === null) return null;
    // O cache Redis guarda campos como texto; aceita lista direta (outras implementações) e "a,b".
    return Array.isArray(salvo.modulos) ? salvo.modulos : String(salvo.modulos).split(",").filter(Boolean);
  } catch {
    return null;
  }
}

async function gravarCache(cache: ConnectionCacheInterface | undefined, chave: string, modulos: string[]): Promise<void> {
  if (!cache) return;
  try {
    await cache.saveObject(chave, { modulos: modulos.join(",") }, CACHE_SEGUNDOS);
  } catch {
    // cache é só otimização
  }
}

export async function exigirModulo(
  repo: Pick<ModuloEmpresaRepository, "listarModulos">,
  cache: ConnectionCacheInterface | undefined,
  companyUuid: string,
  modulo: ModuloChave,
): Promise<void> {
  const bloqueio = () => new ApiError("Módulo não habilitado para esta empresa", 403);
  if (!companyUuid) throw bloqueio();
  const chave = `modulos:${companyUuid}`;
  let modulos = await lerCache(cache, chave);
  if (!modulos) {
    modulos = await repo.listarModulos(companyUuid);
    await gravarCache(cache, chave, modulos);
  }
  if (!modulos.includes(modulo)) throw bloqueio();
}

abstract class ModuloMiddleware implements NestMiddleware {
  protected abstract readonly modulo: ModuloChave;
  constructor(private readonly hub: ConnectionHub) {}

  async use(req: any, res: any, next: (error?: any) => void): Promise<void> {
    await exigirModulo(new ModuloEmpresaRepository(this.hub), this.hub.cache, req.companyUuid, this.modulo);
    next();
  }
}

@Injectable()
export class ModuloIgrejaMiddleware extends ModuloMiddleware {
  protected readonly modulo = "igreja" as const;
  constructor(hub: ConnectionHub) {
    super(hub);
  }
}

@Injectable()
export class ModuloImoveisMiddleware extends ModuloMiddleware {
  protected readonly modulo = "imoveis" as const;
  constructor(hub: ConnectionHub) {
    super(hub);
  }
}

@Injectable()
export class ModuloAdminMiddleware extends ModuloMiddleware {
  protected readonly modulo = "admin" as const;
  constructor(hub: ConnectionHub) {
    super(hub);
  }
}
