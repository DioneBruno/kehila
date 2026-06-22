import { ApiError } from "src/@modules/shared/apiError";
import { GerarCobrancaRepository } from "./gerarCobrancaRepository";
import { PagadorEntity } from "./pagador.entity";

export type GerarCobrancaInput = {
  companyUuid: string;
  userUuid: string;
  pedidoUuid: string;
  tipoPagador: "usuarioLogado" | "avulso" | "ingresso";
  numParcelas?: number;
  pagadorNome?: string;
  pagadorDocumento?: string;
  pagadorEmail?: string;
  pagadorTelefone?: string;
  tipoCobranca?: string;
  cartaoUuid?: string;
};

export class GerarCobrancaUsecase {
  constructor(readonly repo: GerarCobrancaRepository) {}

  async execute(input: GerarCobrancaInput) {
    if (!input.tipoPagador) throw new ApiError("Tipo de pagador não informado", 400);

    const pedido = await this.repo.buscarPedido(input.companyUuid, input.pedidoUuid);
    if (!pedido) throw new ApiError("Pedido não encontrado", 404);

    if (input.tipoPagador === "ingresso") {
      const ingressos = await this.repo.buscarIngressos(input.companyUuid, input.pedidoUuid);
      const valorPorIngresso = pedido.valorTotal() / ingressos.length;
      for (const ingresso of ingressos) {
        await this.repo.criarCobrancaIngresso(pedido, ingresso, valorPorIngresso, input.numParcelas ?? 1);
      }
      await this.repo.atualizarStatusPedidoParaPagamentoGerado(pedido.uuid());
      return;
    }

    const pagador =
      input.tipoPagador === "usuarioLogado"
        ? pedido.usuario()
        : new PagadorEntity({
            nome: input.pagadorNome || "",
            documento: input.pagadorDocumento || "",
            email: input.pagadorEmail || "",
            telefone: input.pagadorTelefone || "",
          });

    await this.repo.criarCobranca(pedido, pagador, input.numParcelas ?? 1, input.tipoCobranca, input.cartaoUuid);
    await this.repo.atualizarStatusPedidoParaPagamentoGerado(pedido.uuid());
  }
}
