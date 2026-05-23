import { CriarPedidoRepository } from "./criarPedidoRepository";

export type CriarPedidoInput = {
  companyUuid: string;
  eventoUuid: string;
  pedido: { tipoIngressoUuid: string; quantidade: number }[];
};

export class CriarPedidoUsecase {
  constructor(readonly repo: CriarPedidoRepository) {}

  async execute(input: CriarPedidoInput) {}
}
