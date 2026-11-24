import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarPessoaRepository {
  constructor(readonly connections: ConnectionHub) {}

  async existe(companyUuid: string, uuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM imovel_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
    return !!row;
  }

  async ehProprietarioDeImovelAtivo(companyUuid: string, uuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT 1 FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND proprietario_uuid = $2 LIMIT 1`,
      [companyUuid, uuid],
    );
    return !!row;
  }

  /** A pessoa é inquilina ou fiadora de contrato vigente da empresa. */
  async temContratoVigente(companyUuid: string, uuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT 1 FROM imovel_contratos
       WHERE deleted_at IS NULL AND company_uuid = $1 AND status = 'vigente' AND (inquilino_uuid = $2 OR fiador_uuid = $2) LIMIT 1`,
      [companyUuid, uuid],
    );
    return !!row;
  }

  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.query(
      `UPDATE imovel_pessoas SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
  }
}
