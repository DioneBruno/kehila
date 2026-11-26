import { ApiError } from "src/@modules/shared/apiError";
import { texto } from "src/@modules/shared/apiTexto";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export const MSG_DOMINIO_FORMATO = "Informe o domínio como origem, ex.: https://app.exemplo.com.br";
export const MSG_DOMINIO_EM_USO = "Este domínio já está em uso por outra empresa";
export const MSG_ULTIMO_DOMINIO = "A empresa precisa de pelo menos um domínio ativo";

const FORMATO_ORIGEM = /^https?:\/\/[a-z0-9.-]+(:\d{1,5})?$/;

export function normalizarDominio(valor: string | null | undefined): string {
  const normalizado = (texto(valor, "domain") ?? "").trim().toLowerCase().replace(/\/+$/, "");
  if (!normalizado) throw new ApiError("O domínio é obrigatório");
  if (!FORMATO_ORIGEM.test(normalizado)) throw new ApiError(MSG_DOMINIO_FORMATO);
  // Browsers enviam o Origin sem a porta padrão; guardar com ela nunca casaria no login.
  return normalizado.replace(/^(https:\/\/.+):443$/, "$1").replace(/^(http:\/\/.+):80$/, "$1");
}

export function garantirActiveBooleano(active: unknown): void {
  if (active !== undefined && typeof active !== "boolean") throw new ApiError("Campo active inválido");
}

export class DominioRegrasRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async dominioEmUso(domain: string, ignorarDominioUuid?: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT 1 AS em_uso FROM auth_company_domains
       WHERE active AND deleted_at IS NULL AND lower(rtrim(domain, '/')) = $1
         AND ($2::uuid IS NULL OR uuid <> $2::uuid)
       LIMIT 1`,
      [domain, ignorarDominioUuid ?? null],
    );
    return !!row;
  }

  async estaAtivo(companyUuid: string, dominioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT active FROM auth_company_domains WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [dominioUuid, companyUuid],
    );
    return !!row?.active;
  }

  async contarOutrosAtivos(companyUuid: string, dominioUuid: string): Promise<number> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT count(*)::int AS total FROM auth_company_domains
       WHERE company_uuid = $1 AND active AND deleted_at IS NULL AND uuid <> $2`,
      [companyUuid, dominioUuid],
    );
    return Number(row?.total ?? 0);
  }

  async buscarDominio(companyUuid: string, dominioUuid: string): Promise<string | null> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT domain FROM auth_company_domains WHERE uuid = $1 AND company_uuid = $2 AND deleted_at IS NULL`,
      [dominioUuid, companyUuid],
    );
    return row?.domain ?? null;
  }
}

export async function garantirDominioLivre(regras: DominioRegrasRepository, domain: string, ignorarUuid?: string): Promise<void> {
  if (await regras.dominioEmUso(domain, ignorarUuid)) throw new ApiError(MSG_DOMINIO_EM_USO, 409);
}

export async function garantirNaoEhUltimoAtivo(regras: DominioRegrasRepository, companyUuid: string, dominioUuid: string): Promise<void> {
  if (!(await regras.estaAtivo(companyUuid, dominioUuid))) return;
  if ((await regras.contarOutrosAtivos(companyUuid, dominioUuid)) === 0) throw new ApiError(MSG_ULTIMO_DOMINIO);
}
