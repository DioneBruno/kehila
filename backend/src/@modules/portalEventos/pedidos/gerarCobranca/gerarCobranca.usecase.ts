import { GerarCobrancaRepository } from "./gerarCobrancaRepository";
import { PagadorEntity } from "./pagador.entity";

export type FecharPedidoInput = {
  companyUuid: string;
  userUuid: string;
  pedidoUuid: string;
  tipoPagador?: "usuarioLogado" | "avulso" | "ingresso";
  pagadorNome?: string;
  pagadorDocumento?: string;
  pagadorEmail?: string;
  pagadorTelefone?: string;
};

export class GerarCobrancaUsecase {
  constructor(readonly repo: GerarCobrancaRepository) {}

  async execute(input: FecharPedidoInput) {
    const pedido = await this.repo.buscarPedido(input.companyUuid, input.pedidoUuid);
    if (!pedido) throw new Error("Pedido não encontrado");

    const ingressos = await this.repo.buscarIngressos(input.companyUuid, input.pedidoUuid);
    if (ingressos.length > 0) {
      const valorPorIngresso = pedido.valorTotal() / ingressos.length;
      for (const ingresso of ingressos) {
        await this.repo.criarCobrancaIngresso(pedido, ingresso, valorPorIngresso);
      }
      return;
    }

    let pagador: PagadorEntity;
    if (input.tipoPagador === "usuarioLogado") {
      pagador = pedido.usuario();
    } else {
      pagador = new PagadorEntity({
        nome: input.pagadorNome || "",
        documento: input.pagadorDocumento || "",
        email: input.pagadorEmail || "",
        telefone: input.pagadorTelefone || "",
      });
    }
    await this.repo.criarCobranca(pedido, pagador);
  }
}
