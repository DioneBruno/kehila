import { FecharPedidoRepository } from "./fecharPedidoRepository";
import { PagadorEntity } from "./pagador.entity";

export type FecharPedidoInput = {
  companyUuid: string;
  userUuid: string;
  pedidoUuid: string;
  pagadorAvulso?: boolean;
  pagadorNome?: string;
  pagadorDocumento?: string;
  pagadorEmail?: string;
  pagadorTelefone?: string;
};

export class FecharPedidoUsecase {
  constructor(readonly repo: FecharPedidoRepository) {}

  async execute(input: FecharPedidoInput) {
    const pedido = await this.repo.buscarPedido(input.companyUuid, input.pedidoUuid);
    if (!pedido) throw new Error("Pedido não encontrado");
    let pagador = pedido.usuario();
    if (input.pagadorAvulso) {
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
