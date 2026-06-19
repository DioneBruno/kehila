import { DataSource } from "typeorm";
import { BiEntity } from "./bi.enitty";

export class BiRepository {
  constructor(readonly dataSource: DataSource) {}

  async biListar(companyUuid: string, userUuid: string, filtros: any) {
    // const [userRoles] = await this.dataSource.query(`SELECT * FROM auth_users_companies WHERE company_id = $1 AND id_user = $2`, [
    //   companyUuid,
    //   userUuid,
    // ]);

    let query = `
      SELECT
        gateway,
        referencia,
        uuid,
        titulo,
        descricao,
        roles
      FROM bi_sumario
      WHERE deleted_at IS NULL
    `;

    const params: any[] = [];

    if (filtros?.pesquisa) {
      const palavras = filtros.pesquisa
        .split(/\s+/)
        .filter(Boolean)
        .map((p: string) => `${p}:*`)
        .join(" | "); // OR

      params.push(palavras);

      query += `
        AND to_tsvector('portuguese', coalesce(titulo,'') || ' ' || coalesce(descricao,''))
            @@ to_tsquery('portuguese', $${params.length})
      `;
    }

    // if (!userRoles.roles.includes("ADMIN")) {
    //   params.push(userRoles.roles);

    //   query += `
    //     AND roles ?| $${params.length}
    //   `;
    // }

    query += `
      ORDER BY titulo ASC
      LIMIT 30
    `;

    const bisModel = await this.dataSource.query(query, params);

    return {
      data: bisModel.map((item) => ({
        gateway: item.gateway,
        referencia: item.referencia,
        uuid: item.uuid,
        titulo: item.titulo,
        descricao: item.descricao,
        roles: item.roles,
      })),
    };
  }

  async findBi(uuid: string): Promise<BiEntity | null> {
    const [biModel] = await this.dataSource.query(
      `SELECT
      gateway,
      referencia,
      uuid,
      titulo,
      descricao,
      parametros
    FROM bi_sumario WHERE uuid = $1`,
      [uuid],
    );
    if (!biModel) return null;
    const bi = new BiEntity({
      companyUuid: biModel.company_uuid,
      uuid: biModel.uuid,
      gateway: biModel.gateway,
      referencia: biModel.referencia,
      titulo: biModel.titulo,
      descricao: biModel.descricao,
      parametros: biModel.parametros,
    });
    return bi;
  }

  async biSave(bi: BiEntity) {
    await this.dataSource.query(
      `INSERT INTO bi_sumario (uuid, company_uuid, gateway, referencia, titulo, descricao, parametros, roles)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (uuid) DO UPDATE SET
        gateway = $3,
        referencia = $4,
        titulo = $5,
        descricao = $6,
        parametros = $7,
        roles = $8`,
      [bi.uuid(), bi.companyUuid(), bi.gateway(), bi.referencia(), bi.titulo(), bi.descricao(), bi.parametros(), JSON.stringify(bi.roles())],
    );
  }

  async biDelete(uuid: string) {
    await this.dataSource.query(`UPDATE bi_sumario SET deleted_at = NOW() WHERE uuid = $1`, [uuid]);
  }
}
