import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type CriarEventoData = {
  companyUuid: string;
  userUuid: string;
  titulo: string;
  slug: string;
  descricao?: string;
  bannerUrl?: string;
  dataInicio: string;
  dataFim?: string;
  capacidadeTotal?: number;
  localNome?: string;
  localEndereco?: string;
  localLat?: number;
  localLng?: number;
  online: boolean;
  linkOnline?: string;
};

export type EventoCriado = {
  uuid: string;
  slug: string;
};

export class CriarEventoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async slugExiste(slug: string): Promise<boolean> {
    const [row] = await this.connectionHub.database.query(`SELECT uuid FROM eventos WHERE slug = $1 AND deleted_at IS NULL`, [slug]);
    return !!row;
  }

  async criar(data: CriarEventoData): Promise<EventoCriado> {
    const [row] = await this.connectionHub.database.query(
      `
      INSERT INTO eventos (
        company_uuid, user_uuid, titulo, slug, descricao, banner_url,
        data_inicio, data_fim, capacidade_total,
        local_nome, local_endereco, local_lat, local_lng,
        online, link_online, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, 'rascunho'
      )
      RETURNING uuid, slug
      `,
      [
        data.companyUuid,
        data.userUuid,
        data.titulo,
        data.slug,
        data.descricao ?? null,
        data.bannerUrl ?? null,
        data.dataInicio,
        data.dataFim ?? null,
        data.capacidadeTotal ?? null,
        data.localNome ?? null,
        data.localEndereco ?? null,
        data.localLat ?? null,
        data.localLng ?? null,
        data.online,
        data.linkOnline ?? null,
      ],
    );
    return row;
  }
}
