import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PresencaEntity } from "./presenca.entity";

export class RegistrarPresencaRepository {
  constructor(readonly connections: ConnectionHub) {}

  async apriscoExiste(companyUuid: string, apriscoUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(`SELECT uuid FROM apriscos WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`, [
      companyUuid,
      apriscoUuid,
    ]);
    return !!row;
  }

  async pessoaExiste(companyUuid: string, pessoaUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM auth_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = $2`,
      [companyUuid, pessoaUuid],
    );
    return !!row;
  }

  async integranteExiste(companyUuid: string, apriscoUuid: string, pessoaUuid: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `SELECT uuid FROM aprisco_integrantes WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND pessoa_uuid = $3`,
      [companyUuid, apriscoUuid, pessoaUuid],
    );
    return !!row;
  }

  /** Registro ativo da mesma reunião (mesma pessoa, ou mesmo tipo quando sem pessoa) */
  async buscarExistente(presenca: PresencaEntity): Promise<string | null> {
    const p = presenca.props;
    const [row]: { uuid: string }[] = await this.connections.database.query(
      `SELECT uuid FROM aprisco_presencas
        WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND data_reuniao = $3 AND tipo = $4
          AND pessoa_uuid IS NOT DISTINCT FROM $5`,
      [p.companyUuid, p.apriscoUuid, p.dataReuniao, p.tipo, p.pessoaUuid],
    );
    return row?.uuid ?? null;
  }

  async incluir(presenca: PresencaEntity): Promise<void> {
    const p = presenca.props;
    await this.connections.database.query(
      `INSERT INTO aprisco_presencas (uuid, company_uuid, aprisco_uuid, tipo, pessoa_uuid, data_reuniao, presenca, quantidade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [p.uuid, p.companyUuid, p.apriscoUuid, p.tipo, p.pessoaUuid, p.dataReuniao, p.presenca, p.quantidade],
    );
  }

  async atualizar(uuid: string, presenca: PresencaEntity): Promise<void> {
    const p = presenca.props;
    await this.connections.database.query(`UPDATE aprisco_presencas SET presenca = $2, quantidade = $3, updated_at = now() WHERE uuid = $1`, [
      uuid,
      p.presenca,
      p.quantidade,
    ]);
  }
}
