import { ApiError } from "src/@modules/shared/apiError";
import { CriarPedidoRepository } from "./criarPedidoRepository";

export type CriarPedidoInput = {
  companyUuid: string;
  eventoUuid: string;
  pedido: { tipoIngressoUuid: string; quantidade: number }[];
};

export class CriarPedidoUsecase {
  constructor(readonly repo: CriarPedidoRepository) {}

  async execute(input: CriarPedidoInput) {
    const evento = await this.repo.buscaEvento(input.companyUuid, input.eventoUuid);
    if (!evento) throw new ApiError("Evento não encontrado", 400);
    const pedido = evento.montaPedido(input.pedido);
    await this.repo.salvarPedido(pedido);
    return pedido;
  }
}
