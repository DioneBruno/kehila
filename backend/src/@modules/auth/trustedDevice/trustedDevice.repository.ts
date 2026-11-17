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
  /** Troca o hash atual, guarda o anterior e atualiza `last_used_at`. */
  rotacionar(input: RotacionarTrustedDeviceInput): Promise<void>;
  revogarPorHash(companyUuid: string, hash: string, agora: Date): Promise<void>;
  usuarioAtivoNaEmpresa(companyUuid: string, userUuid: string): Promise<boolean>;
  gerarToken(companyUuid: string, userUuid: string): Promise<{ token: string }>;
}
