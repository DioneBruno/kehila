import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type PagamentoListItem = {
  uuid: string;
  formaPagamento: string;
  vencimento: string | null;
  valor: number;
  valorComDescGateway: number;
  pagoEm: string | null;
  valorPago: number;
  status: string;
  contaBancariaUuid: string | null;
  bancoRef: string | null;
  nossoNumero: string | null;
  codigoBarras: string | null;
  linhaDigitavel: string | null;
  linkBoleto: string | null;
  linkCartao: string | null;
  pix: string | null;
  createdAt: string;
};

export type CobrancaListItem = {
  uuid: string;
  userUuid: string;
  origemTipo: string | null;
  origemUuid: string | null;
  pagadorNome: string | null;
  pagadorDocumento: string | null;
  pagadorEmail: string | null;
  pagadorTelefone: string | null;
  valor: number;
  valorPago: number;
  status: string;
  createdAt: string;
  pagamentos: PagamentoListItem[];
};

export type ListarCobrancaParams = {
  companyUuid: string;
  busca?: string;
  status?: string;
  pagina: number;
  porPagina: number;
};

export type ListarCobrancaResult = {
  dados: CobrancaListItem[];
  total: number;
};

export class ListarCobrancaRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(params: ListarCobrancaParams): Promise<ListarCobrancaResult> {
    const { companyUuid, busca, status, pagina, porPagina } = params;
    const offset = (pagina - 1) * porPagina;

    const filterBindings: unknown[] = [companyUuid];
    let filterWhere = `WHERE c.deleted_at IS NULL AND c.company_uuid = $1`;
    let idx = 2;

    if (status) {
      filterWhere += ` AND c.status = $${idx}`;
      filterBindings.push(status);
      idx++;
    }

    if (busca) {
      filterWhere += ` AND c.pagador_nome ILIKE $${idx}`;
      filterBindings.push(`%${busca}%`);
      idx++;
    }

    const [countRow] = await this.connectionHub.database!.query(
      `SELECT COUNT(*) AS total FROM financeiro_cobrancas c ${filterWhere}`,
      filterBindings,
    );

    const cobrancas = await this.connectionHub.database!.query(
      `
      SELECT
        c.uuid,
        c.user_uuid AS "userUuid",
        c.origem_tipo AS "origemTipo",
        c.origem_uuid AS "origemUuid",
        c.pagador_nome AS "pagadorNome",
        c.pagador_documento AS "pagadorDocumento",
        c.pagador_email AS "pagadorEmail",
        c.pagador_telefone AS "pagadorTelefone",
        c.valor,
        c.valor_pago AS "valorPago",
        c.status,
        c.created_at AS "createdAt"
      FROM financeiro_cobrancas c
      ${filterWhere}
      ORDER BY c.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...filterBindings, porPagina, offset],
    );

    const total = parseInt(countRow.total, 10);
    if (cobrancas.length === 0) return { dados: [], total };

    const cobrancaUuids = cobrancas.map((c: any) => c.uuid);

    const pagamentos = await this.connectionHub.database!.query(
      `
      SELECT
        p.uuid,
        p.cobanca_uuid AS "cobrancaUuid",
        p.forma_pagamento AS "formaPagamento",
        p.vencimento,
        p.valor,
        p.valor_com_desc_gateway AS "valorComDescGateway",
        p.pago_em AS "pagoEm",
        p.valor_pago AS "valorPago",
        p.status,
        p.conta_bancaria_uuid AS "contaBancariaUuid",
        p.banco_ref AS "bancoRef",
        p.nosso_numero AS "nossoNumero",
        p.codigo_barras AS "codigoBarras",
        p.linha_digitavel AS "linhaDigitavel",
        p.link_boleto AS "linkBoleto",
        p.link_cartao AS "linkCartao",
        p.pix,
        p.created_at AS "createdAt"
      FROM financeiro_pagamentos p
      WHERE p.deleted_at IS NULL AND p.company_uuid = $1 AND p.cobanca_uuid = ANY($2)
      ORDER BY p.created_at ASC
      `,
      [companyUuid, cobrancaUuids],
    );

    const pagamentosPorCobranca = new Map<string, PagamentoListItem[]>();
    for (const pagamento of pagamentos) {
      const lista = pagamentosPorCobranca.get(pagamento.cobrancaUuid) ?? [];
      lista.push({
        uuid: pagamento.uuid,
        formaPagamento: pagamento.formaPagamento,
        vencimento: pagamento.vencimento,
        valor: pagamento.valor,
        valorComDescGateway: pagamento.valorComDescGateway,
        pagoEm: pagamento.pagoEm,
        valorPago: parseFloat(pagamento.valorPago),
        status: pagamento.status,
        contaBancariaUuid: pagamento.contaBancariaUuid,
        bancoRef: pagamento.bancoRef,
        nossoNumero: pagamento.nossoNumero,
        codigoBarras: pagamento.codigoBarras,
        linhaDigitavel: pagamento.linhaDigitavel,
        linkBoleto: pagamento.linkBoleto,
        linkCartao: pagamento.linkCartao,
        pix: pagamento.pix,
        createdAt: pagamento.createdAt,
      });
      pagamentosPorCobranca.set(pagamento.cobrancaUuid, lista);
    }

    const dados = cobrancas.map((c: any) => ({
      uuid: c.uuid,
      userUuid: c.userUuid,
      origemTipo: c.origemTipo,
      origemUuid: c.origemUuid,
      pagadorNome: c.pagadorNome,
      pagadorDocumento: c.pagadorDocumento,
      pagadorEmail: c.pagadorEmail,
      pagadorTelefone: c.pagadorTelefone,
      valor: parseFloat(c.valor),
      valorPago: parseFloat(c.valorPago),
      status: c.status,
      createdAt: c.createdAt,
      pagamentos: pagamentosPorCobranca.get(c.uuid) ?? [],
    }));

    return { dados, total };
  }
}
