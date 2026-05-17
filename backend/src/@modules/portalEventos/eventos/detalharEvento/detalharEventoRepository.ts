import { ConnectionHub } from "src/@modules/shared/connectionHub";

export type EventoDetalhe = {
  uuid: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  bannerUrl: string | null;
  dataInicio: string;
  dataFim: string | null;
  capacidadeTotal: number | null;
  localNome: string | null;
  localEndereco: string | null;
  localLat: number | null;
  localLng: number | null;
  online: boolean;
  linkOnline: string | null;
  status: string;
  createdAt: string;
  lotes: LoteDetalhe[];
};

export type LoteDetalhe = {
  uuid: string;
  nome: string;
  ordem: number;
  quantidade: number;
  preco: number;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
  tiposIngresso: TipoIngressoDetalhe[];
};

export type TipoIngressoDetalhe = {
  uuid: string;
  nome: string;
  descricao: string | null;
  quantidade: number;
  vendidos: number;
  preco: number;
  visivel: boolean;
};

export class DetalharEventoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarPorUuid(companyUuid: string, eventoUuid: string): Promise<EventoDetalhe | null> {
    const [row] = await this.connectionHub.database.query(
      `
      SELECT
        e.uuid, e.titulo, e.slug, e.descricao,
        e.banner_url AS "bannerUrl",
        e.data_inicio AS "dataInicio",
        e.data_fim AS "dataFim",
        e.capacidade_total AS "capacidadeTotal",
        e.local_nome AS "localNome",
        e.local_endereco AS "localEndereco",
        e.local_lat AS "localLat",
        e.local_lng AS "localLng",
        e.online,
        e.link_online AS "linkOnline",
        e.status,
        e.created_at AS "createdAt"
      FROM eventos e
      WHERE e.deleted_at IS NULL
        AND e.company_uuid = $1
        AND e.uuid = $2
      `,
      [companyUuid, eventoUuid],
    );

    if (!row) return null;

    const lotes = await this.buscarLotes(eventoUuid);
    return { ...row, lotes };
  }

  private async buscarLotes(eventoUuid: string): Promise<LoteDetalhe[]> {
    const rows = await this.connectionHub.database.query(
      `
      SELECT
        l.uuid, l.nome, l.ordem, l.quantidade, l.preco,
        l.data_inicio AS "dataInicio",
        l.data_fim AS "dataFim",
        l.ativo
      FROM evento_lotes l
      WHERE l.evento_uuid = $1
      ORDER BY l.ordem ASC
      `,
      [eventoUuid],
    );

    const lotes: LoteDetalhe[] = [];
    for (const lote of rows) {
      const tiposIngresso = await this.buscarTiposIngresso(lote.uuid);
      lotes.push({ ...lote, tiposIngresso });
    }
    return lotes;
  }

  private async buscarTiposIngresso(loteUuid: string): Promise<TipoIngressoDetalhe[]> {
    return this.connectionHub.database.query(
      `
      SELECT
        t.uuid, t.nome, t.descricao, t.quantidade, t.vendidos, t.preco, t.visivel
      FROM evento_lote_tipos_ingresso t
      WHERE t.lote_uuid = $1
      ORDER BY t.preco ASC
      `,
      [loteUuid],
    );
  }
}
