import { ApiError } from "src/@modules/shared/apiError";
import { CriarContaBancariaRepository, ContaBancariaCriada } from "./criarContaBancariaRepository";

export type CriarContaBancariaInput = {
  companyUuid: string;
  nome?: string;
  bancoNumero?: string;
  agencia?: string;
  conta?: string;
  digito?: string;
  chaveApi?: string;
  status?: string;
};

export class CriarContaBancariaUsecase {
  constructor(readonly repo: CriarContaBancariaRepository) {}

  async execute(input: CriarContaBancariaInput): Promise<ContaBancariaCriada> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.nome?.trim()) throw new ApiError("O nome da conta bancária é obrigatório");

    return this.repo.criar({
      companyUuid: input.companyUuid,
      nome: input.nome.trim(),
      bancoNumero: input.bancoNumero,
      agencia: input.agencia,
      conta: input.conta,
      digito: input.digito,
      chaveApi: input.chaveApi,
      status: input.status,
    });
  }
}
