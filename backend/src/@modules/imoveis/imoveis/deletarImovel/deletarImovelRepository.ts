import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export class DeletarImovelRepository {
  constructor(readonly connections: ConnectionHub) {}

  async buscarSituacao(companyUuid: string, uuid: string): Promise<string | null> {
    const [row] = await this.connections.database.query(
      `SELECT situacao FROM imovel_imoveis WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
    return row?.situacao ?? null;
  }

  /** Seam da Task 6: trocar por EXISTS em imovel_contratos (status = 'vigente'); hoje 'alugado' só vem do contrato. */
  async temContratoVigente(companyUuid: string, uuid: string): Promise<boolean> {
    return (await this.buscarSituacao(companyUuid, uuid)) === "alugado";
  }

  async deletar(companyUuid: string, uuid: string): Promise<void> {
    await this.connections.database.query(
      `UPDATE imovel_imoveis SET deleted_at = now(), updated_at = now() WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, uuid],
    );
  }
}
