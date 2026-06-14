import { ApiDate } from "../shared/apiDate";
import { ApiError } from "../shared/apiError";
import { ApiString } from "../shared/apiString";
import { ConnectionHub } from "../shared/connections/connectionHub";

export class PortalEventosQuery {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarEvento(companyUuid: string, eventoUuid: string) {
    const [eventoModel] = await this.connectionHub.database!.query(
      `SELECT 
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
      eventos.online
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
        uuid,
        nome,
        descricao,
        evento_uuid "eventoUuid",
        lote_uuid "loteUuid",
        gerar_quantidade_ingressos "gerarQuantidadeIngressos",
        visivel,
        preco
      FROM evento_lote_tipos_ingresso
      WHERE deleted_at IS NULL
        AND evento_uuid = $1
      ORDER BY ordem ASC`,
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
}
