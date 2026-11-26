import * as bcryptjs from "bcryptjs";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { SQL_ADMIN_ATIVO_BASE, UltimoAdminRepo } from "../ultimoAdmin";

export type UsuarioMeta = {
  batizado?: boolean;
  outraIgreja?: boolean;
};

export type EditarUsuarioData = {
  name?: string;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  cep?: string;
  endereco?: string;
  enderecoNumero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  estadoCivil?: string;
  dataNascimento?: string;
  meta?: UsuarioMeta;
  password?: string;
  position?: string;
  roles?: string[];
  isAccepted?: boolean;
};

export class EditarUsuarioRepository implements UltimoAdminRepo {
  constructor(readonly connectionHub: ConnectionHub) {}

  async existe(companyUuid: string, usuarioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `
      SELECT u.uuid
      FROM auth_users u
        INNER JOIN auth_users_companies uc ON uc.user_uuid = u.uuid
      WHERE u.deleted_at IS NULL
        AND uc.deleted_at IS NULL
        AND uc.company_uuid = $1
        AND u.uuid = $2
      `,
      [companyUuid, usuarioUuid],
    );
    return !!row;
  }

  async ehAdminAtivo(companyUuid: string, usuarioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(`SELECT 1 ${SQL_ADMIN_ATIVO_BASE} AND u.uuid = $2`, [companyUuid, usuarioUuid]);
    return !!row;
  }

  async contarOutrosAdminsAtivos(companyUuid: string, usuarioUuid: string): Promise<number> {
    const [row] = await this.connectionHub.database!.query(`SELECT COUNT(*)::int AS total ${SQL_ADMIN_ATIVO_BASE} AND u.uuid <> $2`, [
      companyUuid,
      usuarioUuid,
    ]);
    return row?.total ?? 0;
  }

  /** Usuários são globais: o mesmo login pode pertencer a várias igrejas. */
  async vinculadoAOutrasEmpresas(companyUuid: string, usuarioUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT 1 FROM auth_users_companies
      WHERE deleted_at IS NULL
        AND user_uuid = $1
        AND company_uuid <> $2
      LIMIT 1`,
      [usuarioUuid, companyUuid],
    );
    return !!row;
  }

  async dadosDeAcesso(usuarioUuid: string): Promise<{ email: string | null; cpf: string | null; phone: string | null }[]> {
    return this.connectionHub.database!.query(`SELECT email, cpf, phone FROM auth_users WHERE uuid = $1`, [usuarioUuid]);
  }

  async atualizar(companyUuid: string, usuarioUuid: string, data: EditarUsuarioData): Promise<void> {
    await this.atualizarUsuario(usuarioUuid, data);
    await this.atualizarVinculoEmpresa(companyUuid, usuarioUuid, data);
  }

  private async atualizarUsuario(usuarioUuid: string, data: EditarUsuarioData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    const mapeamento: Record<string, string> = {
      name: "name",
      cpf: "cpf",
      email: "email",
      phone: "phone",
      cep: "cep",
      endereco: "endereco",
      enderecoNumero: "endereco_numero",
      bairro: "bairro",
      cidade: "cidade",
      uf: "uf",
      estadoCivil: "estado_civil",
      dataNascimento: "data_nascimento",
    };

    for (const [chave, coluna] of Object.entries(mapeamento)) {
      if ((data as any)[chave] !== undefined) {
        campos.push(`${coluna} = $${idx}`);
        valores.push((data as any)[chave]);
        idx++;
      }
    }

    if (data.password !== undefined) {
      const passwordHash = await bcryptjs.hash(data.password, 10);
      campos.push(`password = $${idx}`);
      valores.push(passwordHash);
      idx++;
      campos.push(`password_date_update = $${idx}`);
      valores.push(new Date());
      idx++;
    }

    if (data.meta !== undefined) {
      campos.push(`meta = COALESCE(meta, '{}'::jsonb) || $${idx}::jsonb`);
      valores.push(JSON.stringify(data.meta));
      idx++;
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(usuarioUuid);

    await this.connectionHub.database!.query(`UPDATE auth_users SET ${campos.join(", ")} WHERE uuid = $${idx}`, valores);
  }

  private async atualizarVinculoEmpresa(companyUuid: string, usuarioUuid: string, data: EditarUsuarioData): Promise<void> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (data.position !== undefined) {
      campos.push(`position = $${idx}`);
      valores.push(data.position);
      idx++;
    }

    if (data.roles !== undefined) {
      campos.push(`roles = $${idx}`);
      valores.push(JSON.stringify(data.roles));
      idx++;
    }

    if (data.isAccepted !== undefined) {
      campos.push(`is_accepted = $${idx}`);
      valores.push(data.isAccepted);
      idx++;
    }

    if (campos.length === 0) return;

    campos.push(`updated_at = now()`);
    valores.push(usuarioUuid, companyUuid);

    await this.connectionHub.database!.query(
      `UPDATE auth_users_companies SET ${campos.join(", ")} WHERE user_uuid = $${idx} AND company_uuid = $${idx + 1}`,
      valores,
    );
  }
}
