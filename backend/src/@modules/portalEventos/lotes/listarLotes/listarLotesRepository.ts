import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type TipoIngresso = {
  uuid: string;
  nome: string;
  descricao: string | null;
  quantidade: number;
  gerarQuantidadeIngressos: number;
  vendidos: number;
  disponivel: number;
  preco: number;
  visivel: boolean;
};

export type Lote = {
  uuid: string;
  nome: string;
  ordem: number;
  quantidade: number;
  preco: number;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
  createdAt: string;
  tiposIngresso: TipoIngresso[];
};

export class ListarLotesRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(eventoUuid: string, companyUuid: string): Promise<Lote[]> {
    const lotes = await this.connectionHub.database!.query(
      `
      SELECT
        uuid, nome, ordem, quantidade, preco,
        data_inicio AS "dataInicio", data_fim AS "dataFim",
        ativo, created_at AS "createdAt"
      FROM evento_lotes
      WHERE evento_uuid = $1 AND company_uuid = $2
      ORDER BY ordem ASC
      `,
      [eventoUuid, companyUuid],
    );

    if (lotes.length === 0) return [];

    const loteUuids = lotes.map((l: any) => l.uuid);

    const tipos = await this.connectionHub.database!.query(
      `
      SELECT
        uuid, lote_uuid AS "loteUuid", nome, descricao, quantidade, gerar_quantidade_ingressos as "gerarQuantidadeIngressos",
        vendidos, (quantidade - vendidos) AS disponivel,
        preco, visivel
      FROM evento_lote_tipos_ingresso
      WHERE lote_uuid = ANY($1)
      ORDER BY nome ASC
      `,
      [loteUuids],
    );

    const tiposPorLote = new Map<string, TipoIngresso[]>();
    for (const tipo of tipos) {
      const lista = tiposPorLote.get(tipo.loteUuid) ?? [];
      lista.push({
        uuid: tipo.uuid,
        nome: tipo.nome,
        descricao: tipo.descricao,
        quantidade: tipo.quantidade,
        gerarQuantidadeIngressos: tipo.gerarQuantidadeIngressos,
        vendidos: tipo.vendidos,
        disponivel: tipo.disponivel,
        preco: parseFloat(tipo.preco),
        visivel: tipo.visivel,
      });
      tiposPorLote.set(tipo.loteUuid, lista);
    }

    return lotes.map((l: any) => ({
      uuid: l.uuid,
      nome: l.nome,
      ordem: l.ordem,
      quantidade: l.quantidade,
      preco: parseFloat(l.preco),
      dataInicio: l.dataInicio,
      dataFim: l.dataFim,
      ativo: l.ativo,
      createdAt: l.createdAt,
      tiposIngresso: tiposPorLote.get(l.uuid) ?? [],
    }));
  }
}
