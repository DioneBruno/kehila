import { FecharPedidoRepository } from "./fecharPedidoRepository";
import { PagadorEntity } from "./pagador.entity";

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
    // const pagador = new PagadorEntity({
    //   documento: "",
    //   email: "",
    //   nome: "",
    //   telefone: "",
    // });
    await this.repo.criarCobranca(pedido, pedido.usuario());
  }
}
