import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { IntegranteEntity } from "./integrante.entity";

export class VincularIntegranteRepository {
  constructor(readonly connections: ConnectionHub) {}

  async apriscoExiste(companyUuid: string, apriscoUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(`SELECT uuid FROM apriscos WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
      companyUuid,
      apriscoUuid,
    ]);
    return !!row;
  }

  async pessoaExiste(companyUuid: string, pessoaUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(`SELECT uuid FROM auth_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
      companyUuid,
      pessoaUuid,
    ]);
    return !!row;
  }

  async vinculoExiste(companyUuid: string, apriscoUuid: string, pessoaUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM aprisco_integrantes WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND pessoa_uuid = $3`,
      [companyUuid, apriscoUuid, pessoaUuid],
    );
    return !!row;
  }

  async incluir(integrante: IntegranteEntity): Promise<void> {
    const p = integrante.props;
    await this.connections.database.query(
      `INSERT INTO aprisco_integrantes (uuid, company_uuid, aprisco_uuid, pessoa_uuid, papel) VALUES ($1, $2, $3, $4, $5)`,
      [p.uuid, p.companyUuid, p.apriscoUuid, p.pessoaUuid, p.papel],
    );
  }
}
