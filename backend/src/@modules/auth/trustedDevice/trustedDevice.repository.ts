import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { GenerateTokenAuthenticationUserRepository } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUserRepository";
import { GenerateTokenAuthenticationUserUsecase } from "../generateTokenAuthenticationUser/generateTokenAuthenticationUser.usecase";

export type TrustedDeviceRow = {
  uuid: string;
  userUuid: string;
  companyUuid: string;
  tokenHash: string;
  previousTokenHash: string | null;
  rotatedAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type CriarTrustedDeviceInput = {
  uuid: string;
  userUuid: string;
  companyUuid: string;
  tokenHash: string;
  deviceName: string | null;
  expiresAt: Date;
};

export type RotacionarTrustedDeviceInput = {
  uuid: string;
  novoHash: string;
  hashAnterior: string;
  agora: Date;
  expiresAt: Date;
};

export interface TrustedDeviceRepository {
  criar(input: CriarTrustedDeviceInput): Promise<void>;
  /** Casa `token_hash` OU `previous_token_hash`, sempre dentro da empresa. */
  buscarPorHash(companyUuid: string, hash: string): Promise<TrustedDeviceRow | null>;
  /**
   * Troca o hash atual, guarda o anterior e atualiza `last_used_at`.
   * Devolve `false` se outra requisição já rotacionou (o hash atual não é mais `hashAnterior`).
   */
  rotacionar(input: RotacionarTrustedDeviceInput): Promise<boolean>;
  revogarPorHash(companyUuid: string, hash: string, agora: Date): Promise<void>;
  usuarioAtivoNaEmpresa(companyUuid: string, userUuid: string): Promise<boolean>;
  gerarToken(companyUuid: string, userUuid: string): Promise<{ token: string }>;
}

export class TrustedDeviceRepositoryPg implements TrustedDeviceRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async criar(input: CriarTrustedDeviceInput): Promise<void> {
    await this.connectionHub.database!.query(
      `INSERT INTO auth_trusted_devices (uuid, user_uuid, company_uuid, token_hash, device_name, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.uuid, input.userUuid, input.companyUuid, input.tokenHash, input.deviceName, input.expiresAt],
    );
  }

  async buscarPorHash(companyUuid: string, hash: string): Promise<TrustedDeviceRow | null> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT uuid, user_uuid, company_uuid, token_hash, previous_token_hash, rotated_at, expires_at, revoked_at
       FROM auth_trusted_devices
       WHERE company_uuid = $1 AND (token_hash = $2 OR previous_token_hash = $2)
       LIMIT 1`,
      [companyUuid, hash],
    );
    if (!row) return null;
    return {
      uuid: row.uuid,
      userUuid: row.user_uuid,
      companyUuid: row.company_uuid,
      tokenHash: row.token_hash,
      previousTokenHash: row.previous_token_hash,
      rotatedAt: row.rotated_at ? new Date(row.rotated_at) : null,
      expiresAt: new Date(row.expires_at),
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    };
  }

  async rotacionar(input: RotacionarTrustedDeviceInput): Promise<boolean> {
    // Só rotaciona se o hash atual ainda for o esperado: duas requisições simultâneas com o
    // mesmo token não podem gerar dois tokens novos.
    const result = await this.connectionHub.database!.query(
      `UPDATE auth_trusted_devices
       SET token_hash = $2, previous_token_hash = $3, rotated_at = $4, last_used_at = $4,
           expires_at = $5, updated_at = now()
       WHERE uuid = $1 AND token_hash = $3
       RETURNING uuid`,
      [input.uuid, input.novoHash, input.hashAnterior, input.agora, input.expiresAt],
    );
    // TypeORM/pg devolve [linhas, quantidade] em UPDATE ... RETURNING.
    const linhas = Array.isArray(result?.[0]) ? result[0] : result;
    return Array.isArray(linhas) && linhas.length > 0;
  }

  async revogarPorHash(companyUuid: string, hash: string, agora: Date): Promise<void> {
    await this.connectionHub.database!.query(
      `UPDATE auth_trusted_devices SET revoked_at = $3, updated_at = now()
       WHERE company_uuid = $1 AND (token_hash = $2 OR previous_token_hash = $2) AND revoked_at IS NULL`,
      [companyUuid, hash, agora],
    );
  }

  async usuarioAtivoNaEmpresa(companyUuid: string, userUuid: string): Promise<boolean> {
    const [row] = await this.connectionHub.database!.query(
      `SELECT 1
       FROM auth_users users
         INNER JOIN auth_users_companies uc ON uc.user_uuid = users.uuid
       WHERE users.uuid = $1 AND uc.company_uuid = $2
         AND users.deleted_at IS NULL AND uc.deleted_at IS NULL
       LIMIT 1`,
      [userUuid, companyUuid],
    );
    return !!row;
  }

  async gerarToken(companyUuid: string, userUuid: string): Promise<{ token: string }> {
    const repo = new GenerateTokenAuthenticationUserRepository(this.connectionHub);
    const usecase = new GenerateTokenAuthenticationUserUsecase(repo);
    return usecase.execute({ companyUuid, userUuid });
  }
}
