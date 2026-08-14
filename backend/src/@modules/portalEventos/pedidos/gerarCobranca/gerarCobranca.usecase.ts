import { ApiError } from "src/@modules/shared/apiError";
import { GerarCobrancaRepository } from "./gerarCobrancaRepository";
import { PagadorEntity } from "./pagador.entity";
import { ApiDate } from "src/@modules/shared/apiDate";

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

    if (pedido.dataLimitePagamento()) {
      const dataLimite = pedido.dataLimitePagamento() as string;
      const hoje = ApiDate.now();
      const limite = ApiDate.diff(hoje, dataLimite);
      if (limite < 0) throw new ApiError(`Data limite de pagamento ${ApiDate.format(pedido.dataLimitePagamento() as string, "DD/MM/YYYY")}`, 400);

      const mesesDiferenca = ApiDate.diff(hoje, dataLimite, "month") + 1;
      const numParcelas = input.numParcelas ?? 1;
      if (mesesDiferenca < numParcelas) throw new ApiError(`Quantidade máxima de parcelas deve ser ${mesesDiferenca}`, 400);
    }

    if (input.tipoPagador === "ingresso") {
      const ingressos = await this.repo.buscarIngressos(input.companyUuid, input.pedidoUuid);
      for (const ingresso of ingressos) {
        if (ingresso.valor() <= 0) continue;
        await this.repo.criarCobrancaIngresso(pedido, ingresso, ingresso.valor(), input.numParcelas ?? 1);
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

    await this.repo.criarCobranca({
      pedido,
      pagador,
      numParcelas: input.numParcelas ?? 1,
      tipoCobranca: input.tipoCobranca,
      cartaoUuid: input.cartaoUuid,
    });
    await this.repo.atualizarStatusPedidoParaPagamentoGerado(pedido.uuid());
  }
}
