/**
 * Solicitar boleto de um pagamento
 * para o gateway
 */
import { ApiDate } from "src/@modules/shared/apiDate";
import { GerarBoletoPagamentoRepository } from "./gerarBoletoPagamentoRepository";
import { ApiError } from "src/@modules/shared/apiError";

export type GerarBoletoPagamentoInput = {
  pagamentoUuid: string;
  vencimento?: string;
};

export class GerarBoletoPagamentoUsecase {
  constructor(readonly repo: GerarBoletoPagamentoRepository) {}

  async execute(input: GerarBoletoPagamentoInput) {
    const pagamento = await this.repo.buscarPagamento(input.pagamentoUuid);
    if (!pagamento) throw new ApiError("Pagamento não encontrado", 450);
    if (input.vencimento) pagamento.setVencimento(input.vencimento);
    const dias = ApiDate.diff(ApiDate.now(), pagamento.vencimento(), "days");
    if (dias < 0) throw new ApiError("Data de vencimento deve ser maior que hoje.", 400);
    const gateway = this.repo.buscarGateway(pagamento);
    await gateway.gerarBoleto(pagamento);
    await this.repo.salvarPagamento(pagamento);
  }
}
