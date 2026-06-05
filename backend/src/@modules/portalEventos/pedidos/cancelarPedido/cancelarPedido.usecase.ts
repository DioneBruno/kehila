import { ApiError } from "src/@modules/shared/apiError";
import { CancelarPedidoRepository } from "./cancelarPedidoRepository";

export type CancelarPedidoInput = {
  pedidoUuid: string;
  userUuid: string;
};

export class CancelarPedidoUsecase {
  constructor(readonly repo: CancelarPedidoRepository) {}

  async execute(input: CancelarPedidoInput): Promise<void> {
    if (!input.pedidoUuid) throw new ApiError("UUID do pedido é obrigatório");

    const statusAtual = await this.repo.buscarStatus(input.pedidoUuid, input.userUuid);
    if (!statusAtual) throw new ApiError("Pedido não encontrado", 404);
    if (statusAtual !== "pendente") throw new ApiError(`Não é possível cancelar um pedido com status "${statusAtual}"`);

    await this.repo.cancelarPedido(input.pedidoUuid);
  }
}
