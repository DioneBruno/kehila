import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { VinculoEntity } from "./vinculo.entity";

export class VinculoEntreMembrosRepository {
  constructor(readonly connections: ConnectionHub) {}

  async contarMembrosExistentes(companyUuid: string, membrosUuid: string[]): Promise<number> {
    const [row] = await this.connections.database.query(
      `SELECT count(*)::int AS total FROM auth_pessoas WHERE deleted_at IS NULL AND company_uuid = $1 AND uuid = ANY($2::uuid[])`,
      [companyUuid, membrosUuid],
    );
    return row?.total ?? 0;
  }

  /** Verifica se já existe vínculo entre os dois membros, em qualquer direção. */
  async vinculoExiste(companyUuid: string, membroA: string, membroB: string): Promise<boolean> {
    const [row] = await this.connections.database.query(
      `
      SELECT uuid FROM auth_pessoas_vinculos
      WHERE company_uuid = $1
        AND ((pessoa_uuid = $2 AND pessoa_vinculada_uuid = $3) OR (pessoa_uuid = $3 AND pessoa_vinculada_uuid = $2))
      LIMIT 1
      `,
      [companyUuid, membroA, membroB],
    );
    return !!row;
  }

  /** Insere todos os vínculos num único INSERT (atômico). */
  async incluir(vinculos: VinculoEntity[]): Promise<void> {
    if (!vinculos.length) return;
    const values: any[] = [];
    const linhas = vinculos.map((v, i) => {
      const p = v.props;
      values.push(p.uuid, p.companyUuid, p.pessoaUuid, p.pessoaVinculadaUuid, p.tipo);
      const b = i * 5;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
    });
    await this.connections.database.query(
      `INSERT INTO auth_pessoas_vinculos (uuid, company_uuid, pessoa_uuid, pessoa_vinculada_uuid, tipo) VALUES ${linhas.join(", ")}`,
      values,
    );
  }
}
