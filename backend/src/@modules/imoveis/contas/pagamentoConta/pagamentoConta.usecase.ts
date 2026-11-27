import { ApiError } from "src/@modules/shared/apiError";
import { garantirUuid } from "../../shared/garantirUuid";
import { MSG_CONTA_NAO_ENCONTRADA, validarPagamento } from "../conta.entity";
import { PagamentoContaRepository } from "./pagamentoContaRepository";

export type RegistrarPagamentoInput = { companyUuid: string; uuid: string; hoje: string; pagoEm: unknown; valorPago?: unknown };
export type DesfazerPagamentoInput = { companyUuid: string; uuid: string };

export class PagamentoContaUsecase {
  constructor(readonly repo: PagamentoContaRepository) {}

  async registrar(input: RegistrarPagamentoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, MSG_CONTA_NAO_ENCONTRADA);
    await this.repo.registrar(input.companyUuid, uuid, (valorConta) =>
      validarPagamento({ pagoEm: input.pagoEm, valorPago: input.valorPago }, valorConta, input.hoje),
    );
  }

  async desfazer(input: DesfazerPagamentoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, MSG_CONTA_NAO_ENCONTRADA);
    await this.repo.desfazer(input.companyUuid, uuid);
  }
}
