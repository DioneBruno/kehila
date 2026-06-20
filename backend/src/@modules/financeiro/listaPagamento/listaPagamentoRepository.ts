import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

export type PagamentoListItem = {
  uuid: string;
  cobrancaUuid: string;
  pagadorNome: string | null;
  pagadorDocumento: string | null;
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

export type ListaPagamentoParams = {
  companyUuid: string;
  busca?: string;
  status?: string;
  pagina: number;
  porPagina: number;
};

export type ListaPagamentoResult = {
  dados: PagamentoListItem[];
  total: number;
};

export class ListaPagamentoRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listar(params: ListaPagamentoParams): Promise<ListaPagamentoResult> {
    const { companyUuid, busca, status, pagina, porPagina } = params;
    const offset = (pagina - 1) * porPagina;

    const filterBindings: unknown[] = [companyUuid];
    let filterWhere = `WHERE p.deleted_at IS NULL AND p.company_uuid = $1`;
    let idx = 2;

    if (status) {
      filterWhere += ` AND p.status = $${idx}`;
      filterBindings.push(status);
      idx++;
    }

    if (busca) {
      filterWhere += ` AND c.pagador_nome ILIKE $${idx}`;
      filterBindings.push(`%${busca}%`);
      idx++;
    }

    const [countRow] = await this.connectionHub.database!.query(
      `
      SELECT COUNT(*) AS total
      FROM financeiro_pagamentos p
      LEFT JOIN financeiro_cobrancas c ON c.uuid = p.cobanca_uuid
      ${filterWhere}
      `,
      filterBindings,
    );

    const pagamentos = await this.connectionHub.database!.query(
      `
      SELECT
        p.uuid,
        p.cobanca_uuid AS "cobrancaUuid",
        c.pagador_nome AS "pagadorNome",
        c.pagador_documento AS "pagadorDocumento",
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
      LEFT JOIN financeiro_cobrancas c ON c.uuid = p.cobanca_uuid
      ${filterWhere}
      ORDER BY p.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...filterBindings, porPagina, offset],
    );

    const dados = pagamentos.map((p: any) => ({
      uuid: p.uuid,
      cobrancaUuid: p.cobrancaUuid,
      pagadorNome: p.pagadorNome,
      pagadorDocumento: p.pagadorDocumento,
      formaPagamento: p.formaPagamento,
      vencimento: p.vencimento,
      valor: parseFloat(p.valor),
      valorComDescGateway: parseFloat(p.valorComDescGateway),
      pagoEm: p.pagoEm,
      valorPago: parseFloat(p.valorPago),
      status: p.status,
      contaBancariaUuid: p.contaBancariaUuid,
      bancoRef: p.bancoRef,
      nossoNumero: p.nossoNumero,
      codigoBarras: p.codigoBarras,
      linhaDigitavel: p.linhaDigitavel,
      linkBoleto: p.linkBoleto,
      linkCartao: p.linkCartao,
      pix: p.pix,
      createdAt: p.createdAt,
    }));

    return { dados, total: parseInt(countRow.total, 10) };
  }
}
