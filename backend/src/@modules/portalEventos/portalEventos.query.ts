import { ApiDate } from "../shared/apiDate";
import { ApiError } from "../shared/apiError";
import { ApiString } from "../shared/apiString";
import { ConnectionHub } from "../shared/connections/connectionHub";

export class PortalEventosQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarEvento(companyUuid: string, eventoUuid: string) {
    const [eventoModel] = await this.connectionHub.database!.query(
      `SELECT 
      eventos.company_uuid "companyUuid",
      eventos.uuid,
      eventos.banner_url "bannerUrl",
      eventos.titulo,
      eventos.descricao,
      eventos.data_fim "dataFim",
      eventos.data_inicio "dataInicio",
      eventos.local_endereco "localEndereco",
      eventos.local_lat "localLat",
      eventos.local_lng "localLng",
      eventos.local_nome "localNome",
      eventos.online,
      eventos.suporte_telefone "suporteTelefone",
      eventos.suporte_email "suporteEmail"
    FROM eventos
    WHERE deleted_at IS NULL
      AND uuid = $1`,
      [eventoUuid],
    );
    if (!eventoModel) throw new ApiError("Evento não encontrado");

    const lotesModel = await this.connectionHub.database!.query(
      `SELECT
        uuid,
        ativo,
        data_fim "dataFim",
        data_inicio "dataInicio",
        nome
      FROM evento_lotes
      WHERE deleted_at IS NULL
        AND evento_uuid = $1
      ORDER BY ordem ASC`,
      [eventoUuid],
    );

    const tiposIngressoModel = await this.connectionHub.database!.query(
      `SELECT
        tipos_ingresso.uuid,
        tipos_ingresso.nome,
        tipos_ingresso.descricao,
        tipos_ingresso.evento_uuid "eventoUuid",
        tipos_ingresso.lote_uuid "loteUuid",
        tipos_ingresso.gerar_quantidade_ingressos "gerarQuantidadeIngressos",
        tipos_ingresso.visivel,
        tipos_ingresso.preco,
        tipos_ingresso.quantidade,
        CASE
          WHEN tipos_ingresso.quantidade = 0 THEN NULL
          ELSE GREATEST(
            tipos_ingresso.quantidade - (
              SELECT COUNT(*)::int
              FROM evento_ingressos ingressos
              WHERE ingressos.deleted_at IS NULL
                AND ingressos.tipo_ingresso_uuid = tipos_ingresso.uuid
            ),
            0
          )
        END "disponivel"
      FROM evento_lote_tipos_ingresso tipos_ingresso
      WHERE tipos_ingresso.visivel = true
        AND tipos_ingresso.deleted_at IS NULL
        AND tipos_ingresso.evento_uuid = $1
      ORDER BY tipos_ingresso.ordem ASC`,
      [eventoUuid],
    );

    eventoModel.lotes = lotesModel;

    for (const lote of lotesModel) {
      lote.tiposIngresso = tiposIngressoModel.filter((tipoIngresso) => tipoIngresso.loteUuid === lote.uuid);
    }

    // eventoModel.tiposIngresso = tiposIngressoModel;

    return {
      ...eventoModel,
      dataFim: ApiDate.format(eventoModel.dataFim, "YYYY-MM-DD HH:mm"),
      dataInicio: ApiDate.format(eventoModel.dataInicio, "YYYY-MM-DD HH:mm"),
    };
  }

  async listarPedidosDoUsuario(input: { companyUuid: string; eventoUuid: string; userUuid: string }): Promise<any[]> {
    const pedidosModel = await this.connectionHub.database!.query(
      `SELECT
        pedidos.created_at as "createdAt",
        pedidos.uuid,
        pedidos.status,
        pedidos.valor_liquido "valorLiquido",
        pedidos.pago_em "pagoEm",
        (
          SELECT COUNT(*)::int
          FROM evento_ingressos ingressos
          WHERE ingressos.deleted_at IS NULL
            AND ingressos.pedido_uuid = pedidos.uuid
        ) AS "quantidadeIngressos"
      FROM evento_pedidos pedidos
      WHERE pedidos.deleted_at IS NULL
        AND pedidos.status NOT IN ('cancelado')
        AND pedidos.evento_uuid = $1
        AND pedidos.user_uuid = $2
      ORDER BY pedidos.created_at DESC
      `,
      [input.eventoUuid, input.userUuid],
    );

    return pedidosModel.map((pedido) => ({
      ...pedido,
      createdAt: ApiDate.format(pedido.createdAt, "YYYY-MM-DD HH:mm"),
      pagoEm: ApiDate.format(pedido.pagoEm, "YYYY-MM-DD HH:mm"),
    }));
  }

  async buscarPedido(pedidoUuid: string) {
    const [pedidoModel] = await this.connectionHub.database!.query(
      `SELECT 
        pedidos.created_at as "createdAt",
        pedidos.uuid,
        pedidos.status,
        pedidos.valor_liquido "valorLiquido",
        pedidos.pago_em "pagoEm"
      FROM evento_pedidos pedidos
      WHERE deleted_at IS NULL
        AND uuid = $1
      `,
      [pedidoUuid],
    );
    if (!pedidoModel) return null;

    pedidoModel.createdAt = ApiDate.format(pedidoModel.createdAt, "YYYY-MM-DD HH:mm");
    pedidoModel.pagoEm = ApiDate.format(pedidoModel.pagoEm, "YYYY-MM-DD HH:mm");

    const ingressosModel = await this.connectionHub.database!.query(
      `
      SELECT 
        ingressos.uuid,
        ingressos.codigo,
        ingressos.pessoa_nome "pessoaNome",
        ingressos.pessoa_email "pessoaEmail",
        ingressos.pessoa_telefone "pessoaTelefone",
        ingressos.pessoa_documento "pessoaDocumento",
        ingressos.pessoa_pais "pessoaPais",
        ingressos.pessoa_uf "pessoaUf",
        ingressos.pessoa_cidade "pessoaCidade",
        ingressos.form_data "formData",
        ingressos.form_data_valido "formDataValido",
        tipos_ingresso.nome "tipoIngressoNome"
      FROM evento_ingressos ingressos
        INNER JOIN evento_lote_tipos_ingresso tipos_ingresso
          ON tipos_ingresso.uuid = ingressos.tipo_ingresso_uuid
      WHERE ingressos.deleted_at IS NULL
        AND ingressos.pedido_uuid = $1
      ORDER BY tipos_ingresso.uuid, ingressos.index
      `,
      [pedidoUuid],
    );

    let cobrancasModel = await this.connectionHub.database?.query(
      `
      SELECT
        cobrancas.created_at "createdAt",
        cobrancas.uuid,
        cobrancas.pagador_nome "pagadorNome",
        cobrancas.pagador_documento "pagadorDocumento",
        cobrancas.valor "valor",
        cobrancas.valor_pago "valorPago",
        cobrancas.status,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'uuid',                   p.uuid,
                'formaPagamento',         p.forma_pagamento,
                'vencimento',             p.vencimento,
                'valor',                  p.valor,
                'valorPago',              p.valor_pago,
                'pagoEm',                 p.pago_em,
                'status',                 p.status,
                'bancoRef',               p.banco_ref,
                'codigoBarras',           p.codigo_barras,
                'linhaDigitavel',         p.linha_digitavel,
                'linkBoleto',             p.link_boleto,
                'pix',                    p.pix,
                'createdAt',              p.created_at
              )
              ORDER BY p.vencimento ASC
            )
            FROM financeiro_pagamentos p
            WHERE p.deleted_at IS NULL
              AND p.cobanca_uuid = cobrancas.uuid
          ),
          '[]'::json
        ) "pagamentos"
      FROM financeiro_cobrancas cobrancas
      WHERE deleted_at IS NULL
        AND cobrancas.origem_tipo IN ('eventoPedido', 'eventoIngresso')
        AND cobrancas.origem_uuid = ANY($1)
      ORDER BY created_at DESC
      `,
      [[pedidoUuid, ...ingressosModel.map((ingresso) => ingresso.uuid)]],
    );

    cobrancasModel = cobrancasModel.map((cobranca) => ({
      ...cobranca,
      pagadorDocumento: ApiString.ocultarCpfCnpj(cobranca.pagadorDocumento),
      createdAt: ApiDate.format(cobranca.createdAt, "YYYY-MM-DD HH:mm"),
      pagoEm: ApiDate.format(cobranca.pagoEm, "YYYY-MM-DD HH:mm"),
      pagamentos: cobranca.pagamentos.map((p) => ({
        ...p,
        createdAt: ApiDate.format(p.createdAt, "YYYY-MM-DD HH:mm"),
        pagoEm: ApiDate.format(p.pagoEm, "YYYY-MM-DD HH:mm"),
      })),
    }));

    return { ...pedidoModel, ingressos: ingressosModel, cobrancas: cobrancasModel };
  }

  async listaPublicaInscritos(eventoUuid: string, filtro?: string, pagina = 1) {
    const porPagina = 10;
    const paginaAtual = Math.max(1, pagina);
    const offset = (paginaAtual - 1) * porPagina;

    const bindings: unknown[] = [eventoUuid];
    let filterWhere = "";

    if (filtro) {
      filterWhere = `
        AND (
          ingressos.pessoa_nome ILIKE $2
          OR ingressos.pessoa_email ILIKE $2
          OR ingressos.pessoa_documento ILIKE $2
        )
      `;
      bindings.push(`%${filtro}%`);
    }

    const [countRow] = await this.connectionHub.database!.query(
      `
      SELECT COUNT(*) "total"
      FROM evento_ingressos ingressos
        INNER JOIN evento_lote_tipos_ingresso tipos_ingresso
          ON tipos_ingresso.uuid = ingressos.tipo_ingresso_uuid
        INNER JOIN evento_lotes lotes
          ON lotes.uuid = tipos_ingresso.lote_uuid
        INNER JOIN evento_pedidos pedidos
          ON pedidos.uuid = ingressos.pedido_uuid
      WHERE pedidos.deleted_at IS NULL
        AND pedidos.status IN ('pago', 'pagamento_gerado')
        AND ingressos.deleted_at IS NULL
        AND ingressos.pessoa_nome IS NOT NULL
        AND ingressos.pessoa_nome != ''
        AND ingressos.pessoa_documento IS NOT NULL
        AND ingressos.pessoa_documento != ''
        AND ingressos.evento_uuid = $1
        ${filterWhere}
      `,
      bindings,
    );

    const ingressosModel = await this.connectionHub.database!.query(
      `
      SELECT
        ingressos.pessoa_nome "pessoaNome",
        ingressos.pessoa_email "pessoaEmail",
        ingressos.pessoa_telefone "pessoaTelefone",
        ingressos.pessoa_documento "pessoaDocumento",
        ingressos.pessoa_pais "pessoaPais",
        ingressos.pessoa_uf "pessoaUf",
        ingressos.pessoa_cidade "pessoaCidade",
        ingressos.form_data->>'distrito' "distrito",
        ingressos.status
      FROM evento_ingressos ingressos
        INNER JOIN evento_lote_tipos_ingresso tipos_ingresso
          ON tipos_ingresso.uuid = ingressos.tipo_ingresso_uuid
        INNER JOIN evento_lotes lotes
          ON lotes.uuid = tipos_ingresso.lote_uuid
        INNER JOIN evento_pedidos pedidos
          ON pedidos.uuid = ingressos.pedido_uuid
      WHERE pedidos.deleted_at IS NULL
        AND pedidos.status IN ('pago', 'pagamento_gerado')
        AND ingressos.deleted_at IS NULL
        AND ingressos.pessoa_nome IS NOT NULL
        AND ingressos.pessoa_nome != ''
        AND ingressos.pessoa_documento IS NOT NULL
        AND ingressos.pessoa_documento != ''
        AND ingressos.evento_uuid = $1
        ${filterWhere}
      ORDER BY ingressos.index
      LIMIT $${bindings.length + 1} OFFSET $${bindings.length + 2}
      `,
      [...bindings, porPagina, offset],
    );

    return {
      dados: ingressosModel.map((ingresso) => {
        return {
          ...ingresso,
          pessoaNome: ApiString.ocultarNomePessoa(ingresso.pessoaNome),
          pessoaDocumento: ApiString.ocultarCpfCnpj(ingresso.pessoaDocumento),
          pessoaEmail: ApiString.ocultarEmail(ingresso.pessoaEmail),
          pessoaTelefone: ApiString.ocultarTelefone(ingresso.pessoaTelefone),
        };
      }),
      total: parseInt(countRow.total, 10),
      pagina: paginaAtual,
      porPagina,
    };
  }

  async listaPublicaCidade(eventoUuid: string): Promise<{ cidade: string; total: number }[]> {
    return this.connectionHub.database!.query(
      `
      SELECT
        ingressos.pessoa_cidade "cidade",
        COUNT(*)::int "total"
      FROM evento_ingressos ingressos
        INNER JOIN evento_lote_tipos_ingresso tipos_ingresso
          ON tipos_ingresso.uuid = ingressos.tipo_ingresso_uuid
        INNER JOIN evento_lotes lotes
          ON lotes.uuid = tipos_ingresso.lote_uuid
        INNER JOIN evento_pedidos pedidos
          ON pedidos.uuid = ingressos.pedido_uuid
      WHERE pedidos.deleted_at IS NULL
        AND pedidos.status IN ('pago', 'pagamento_gerado')
        AND ingressos.deleted_at IS NULL
        AND ingressos.pessoa_nome IS NOT NULL
        AND ingressos.pessoa_nome != ''
        AND ingressos.pessoa_documento IS NOT NULL
        AND ingressos.pessoa_documento != ''
        AND ingressos.pessoa_cidade IS NOT NULL
        AND ingressos.pessoa_cidade != ''
        AND ingressos.evento_uuid = $1
      GROUP BY ingressos.pessoa_cidade
      ORDER BY "total" DESC
      `,
      [eventoUuid],
    );
  }

  async listaPublicaUf(eventoUuid: string): Promise<{ uf: string; total: number }[]> {
    return this.connectionHub.database!.query(
      `
      SELECT
        ingressos.pessoa_uf "uf",
        COUNT(*)::int "total"
      FROM evento_ingressos ingressos
        INNER JOIN evento_lote_tipos_ingresso tipos_ingresso
          ON tipos_ingresso.uuid = ingressos.tipo_ingresso_uuid
        INNER JOIN evento_lotes lotes
          ON lotes.uuid = tipos_ingresso.lote_uuid
        INNER JOIN evento_pedidos pedidos
          ON pedidos.uuid = ingressos.pedido_uuid
      WHERE pedidos.deleted_at IS NULL
        AND pedidos.status IN ('pago', 'pagamento_gerado')
        AND ingressos.deleted_at IS NULL
        AND ingressos.pessoa_nome IS NOT NULL
        AND ingressos.pessoa_nome != ''
        AND ingressos.pessoa_documento IS NOT NULL
        AND ingressos.pessoa_documento != ''
        AND ingressos.pessoa_uf IS NOT NULL
        AND ingressos.pessoa_uf != ''
        AND ingressos.evento_uuid = $1
      GROUP BY ingressos.pessoa_uf
      ORDER BY "total" DESC
      `,
      [eventoUuid],
    );
  }

  async listaPublicaDistrito(eventoUuid: string): Promise<{ distrito: string; total: number }[]> {
    return this.connectionHub.database!.query(
      `
      SELECT
        ingressos.form_data->>'distrito' "distrito",
        COUNT(*)::int "total"
      FROM evento_ingressos ingressos
        INNER JOIN evento_lote_tipos_ingresso tipos_ingresso
          ON tipos_ingresso.uuid = ingressos.tipo_ingresso_uuid
        INNER JOIN evento_lotes lotes
          ON lotes.uuid = tipos_ingresso.lote_uuid
        INNER JOIN evento_pedidos pedidos
          ON pedidos.uuid = ingressos.pedido_uuid
      WHERE pedidos.deleted_at IS NULL
        AND pedidos.status IN ('pago', 'pagamento_gerado')
        AND ingressos.deleted_at IS NULL
        AND ingressos.pessoa_nome IS NOT NULL
        AND ingressos.pessoa_nome != ''
        AND ingressos.pessoa_documento IS NOT NULL
        AND ingressos.pessoa_documento != ''
        AND ingressos.form_data->>'distrito' IS NOT NULL
        AND ingressos.form_data->>'distrito' != ''
        AND ingressos.evento_uuid = $1
      GROUP BY ingressos.form_data->>'distrito'
      ORDER BY "total" DESC
      `,
      [eventoUuid],
    );
  }
}
