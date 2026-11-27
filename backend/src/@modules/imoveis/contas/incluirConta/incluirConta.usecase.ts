import { randomUUID } from "crypto";
import { validarDadosConta, validarPagamento } from "../conta.entity";
import { IncluirContaRepository } from "./incluirContaRepository";

export type IncluirContaInput = { companyUuid: string; hoje: string } & Record<string, unknown>;

export class IncluirContaUsecase {
  constructor(readonly repo: IncluirContaRepository) {}

  async execute(input: IncluirContaInput): Promise<{ uuid: string }> {
    const dados = validarDadosConta(input);
    const semPagamento = input.pagoEm === undefined || input.pagoEm === null || input.pagoEm === "";
    const pagamento = semPagamento ? null : validarPagamento({ pagoEm: input.pagoEm, valorPago: input.valorPago }, dados.valor, input.hoje);
    const uuid = randomUUID();
    await this.repo.incluir(input.companyUuid, [
      {
        ...dados,
        uuid,
        proprietarioUuid: dados.proprietarioUuid ?? "",
        pagoEm: pagamento?.pagoEm ?? null,
        valorPago: pagamento?.valorPago ?? null,
        grupoUuid: null,
        parcelaNumero: null,
        parcelaTotal: null,
      },
    ]);
    return { uuid };
  }
}
