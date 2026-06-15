import { ApiError } from "src/@modules/shared/apiError";
import { EditarContaBancariaRepository } from "./editarContaBancariaRepository";

export type EditarContaBancariaInput = {
  companyUuid: string;
  contaBancariaUuid: string;
  nome?: string;
  bancoNumero?: string;
  agencia?: string;
  conta?: string;
  digito?: string;
  chaveApi?: string;
  status?: string;
  ambiente?: string;
};

export class EditarContaBancariaUsecase {
  constructor(readonly repo: EditarContaBancariaRepository) {}

  async execute(input: EditarContaBancariaInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.contaBancariaUuid) throw new ApiError("UUID da conta bancária é obrigatório");

    const existe = await this.repo.existe(input.companyUuid, input.contaBancariaUuid);
    if (!existe) throw new ApiError("Conta bancária não encontrada", 404);

    await this.repo.atualizar(input.companyUuid, input.contaBancariaUuid, {
      nome: input.nome,
      bancoNumero: input.bancoNumero,
      agencia: input.agencia,
      conta: input.conta,
      digito: input.digito,
      chaveApi: input.chaveApi,
      status: input.status,
      ambiente: input.ambiente,
    });
  }
}
