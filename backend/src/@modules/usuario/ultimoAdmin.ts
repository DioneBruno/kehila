import { ApiError } from "src/@modules/shared/apiError";

export const MSG_ULTIMO_ADMIN = "A empresa precisa de pelo menos um administrador";

export interface UltimoAdminRepo {
  ehAdminAtivo(companyUuid: string, usuarioUuid: string): Promise<boolean>;
  contarOutrosAdminsAtivos(companyUuid: string, usuarioUuid: string): Promise<number>;
}

export async function garantirNaoEhUltimoAdmin(repo: UltimoAdminRepo, companyUuid: string, usuarioUuid: string): Promise<void> {
  if (!(await repo.ehAdminAtivo(companyUuid, usuarioUuid))) return;
  if ((await repo.contarOutrosAdminsAtivos(companyUuid, usuarioUuid)) === 0) throw new ApiError(MSG_ULTIMO_ADMIN);
}

/** Admin ativo = vínculo admin aceito e não removido, de usuário não removido. */
export const SQL_ADMIN_ATIVO_BASE = `
  FROM auth_users u
    INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
  WHERE u.deleted_at IS NULL
    AND uc.deleted_at IS NULL
    AND uc.is_accepted = true
    AND uc.position = 'admin'
    AND uc.company_uuid = $1`;
