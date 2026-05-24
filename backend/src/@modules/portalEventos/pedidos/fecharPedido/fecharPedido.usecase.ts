import { FecharPedidoRepository } from "./fecharPedidoRepository";

export type FecharPedidoInput = {
  companyUuid: string;
  userUuid: string;
  pedidoUuid: string;
};

export class FecharPedidoUsecase {
  constructor(readonly repo: FecharPedidoRepository) {}

  async execute(input: FecharPedidoInput) {
    const pedido = await this.repo.buscarPedido(input.companyUuid, input.pedidoUuid);
    if (!pedido) throw new Error("Pedido não encontrado");
  }
}
