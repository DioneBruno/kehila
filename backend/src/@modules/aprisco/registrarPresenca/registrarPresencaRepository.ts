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

  async pessoasExistentes(companyUuid: string, pessoaUuids: string[]): Promise<Set<string>> {
    const rows: { uuid: string }[] = await this.connections.database.query(
      `SELECT uuid FROM auth_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid::text = ANY($2::text[])`,
      [companyUuid, pessoaUuids],
    );
    return new Set(rows.map((r) => r.uuid));
  }

  async integrantesDoAprisco(companyUuid: string, apriscoUuid: string, pessoaUuids: string[]): Promise<Set<string>> {
    const rows: { pessoa_uuid: string }[] = await this.connections.database.query(
      `SELECT pessoa_uuid FROM aprisco_integrantes
        WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND pessoa_uuid::text = ANY($3::text[])`,
      [companyUuid, apriscoUuid, pessoaUuids],
    );
    return new Set(rows.map((r) => r.pessoa_uuid));
  }

  /**
   * Inclui ou atualiza (registro ativo da mesma reunião: mesma pessoa, ou mesmo tipo quando sem pessoa)
   * todas as presenças em uma única transação. Retorna os uuids na mesma ordem da entrada.
   */
  async salvar(presencas: PresencaEntity[]): Promise<string[]> {
    return this.connections.database.transaction(async (manager) => {
      const uuids: string[] = [];
      for (const presenca of presencas) {
        const p = presenca.props;
        const [existente]: { uuid: string }[] = await manager.query(
          `SELECT uuid FROM aprisco_presencas
            WHERE deleted_at IS NULL AND company_uuid = $1 AND aprisco_uuid = $2 AND data_reuniao = $3 AND tipo = $4
              AND pessoa_uuid IS NOT DISTINCT FROM $5`,
          [p.companyUuid, p.apriscoUuid, p.dataReuniao, p.tipo, p.pessoaUuid],
        );
        if (existente) {
          await manager.query(`UPDATE aprisco_presencas SET presenca = $2, quantidade = $3, updated_at = now() WHERE uuid = $1`, [
            existente.uuid,
            p.presenca,
            p.quantidade,
          ]);
          uuids.push(existente.uuid);
        } else {
          await manager.query(
            `INSERT INTO aprisco_presencas (uuid, company_uuid, aprisco_uuid, tipo, pessoa_uuid, data_reuniao, presenca, quantidade)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [p.uuid, p.companyUuid, p.apriscoUuid, p.tipo, p.pessoaUuid, p.dataReuniao, p.presenca, p.quantidade],
          );
          uuids.push(p.uuid);
        }
      }
      return uuids;
    });
  }
}
