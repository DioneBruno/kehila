import { ApiError } from "src/@modules/shared/apiError";
import { InformarPagamentoManualRepository } from "./informarPagamentoManualRepository";

export type InformarPagamentoManualInput = {
  companyUuid: string;
  userUuid: string;
  pagamentoUuid: string;
  valorPago: number;
  pagoEm: string;
  pagoDescricao: string;
};

export class InformarPagamentoManualUsecase {
  constructor(readonly repo: InformarPagamentoManualRepository) {}

  async execute(input: InformarPagamentoManualInput) {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.pagoDescricao) throw new ApiError("Descrição deve ser informado");
    const pagamento = await this.repo.buscarPagamento(input.companyUuid, input.pagamentoUuid);
    if (!pagamento) throw new ApiError("Pagamento não encontrado");
    const pagamentoInput = {
      userUuid: input.userUuid,
      pagoEm: input.pagoEm,
      pagoDescricao: input.pagoDescricao,
      valorPago: input.valorPago,
    };
    pagamento.informarPagamentoManual(pagamentoInput);
    await this.repo.salvarPagamento(pagamento);
    return pagamento;
  }
}
