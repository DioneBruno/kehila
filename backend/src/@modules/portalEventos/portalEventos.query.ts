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
      FROM evento_lotes WHERE deleted_at IS NULL AND evento_uuid = $1`,
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
      FROM evento_lote_tipos_ingresso WHERE deleted_at IS NULL AND evento_uuid = $1`,
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

    const ingressosModel = await this.connectionHub.database!.query(
      `
      SELECT 
        uuid,
        codigo,
        pessoa_nome "pessoaNome",
        pessoa_email "pessoaEmail",
        pessoa_telefone "pessoaTelefone",
        pessoa_documento "pessoaDocumento",
        pessoa_uf "pessoaUf",
        pessoa_cidade "pessoaCidade",
        form_data "formData",
        form_data_valido "formDataValido"
      FROM evento_ingressos ingressos
      WHERE ingressos.deleted_at IS NULL
        AND ingressos.pedido_uuid = $1
      ORDER BY index
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
        cobrancas.status
      FROM financeiro_cobrancas cobrancas
      WHERE deleted_at IS NULL
        AND cobrancas.origem_tipo IN ('eventoPedido', 'eventoIngresso')
        AND cobrancas.origem_uuid = ANY($1)
      ORDER BY created_at desc
      `,
      [[pedidoUuid, ...ingressosModel.map((ingresso) => ingresso.uuid)]],
    );

    cobrancasModel = cobrancasModel.map((cobranca) => ({
      ...cobranca,
      pagadorDocumento: ApiString.ocultarCpfCnpj(cobranca.pagadorDocumento),
      createdAt: ApiDate.format(cobranca.createdAt, "YYYY-MM-DD HH:mm"),
      pagoEm: ApiDate.format(cobranca.pagoEm, "YYYY-MM-DD HH:mm"),
    }));

    return { ...pedidoModel, ingressos: ingressosModel, cobrancas: cobrancasModel };
  }
}
