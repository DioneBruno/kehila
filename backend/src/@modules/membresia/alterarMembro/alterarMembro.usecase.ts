import { ApiError } from "src/@modules/shared/apiError";
import { AlterarMembroData, AlterarMembroRepository } from "./alterarMembroRepository";

export type AlterarMembroInput = AlterarMembroData & {
  companyUuid: string;
  membroUuid: string;
};

export class AlterarMembroUsecase {
  constructor(readonly repo: AlterarMembroRepository) {}

  async execute(input: AlterarMembroInput): Promise<void> {
    const { companyUuid, membroUuid, ...data } = input;

    if (!companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!membroUuid) throw new ApiError("Membro não identificado");
    if (data.nome !== undefined && !data.nome?.trim()) throw new ApiError("O nome do membro é obrigatório");

    const existe = await this.repo.existe(companyUuid, membroUuid);
    if (!existe) throw new ApiError("Membro não encontrado", 404);

    await this.repo.alterar(companyUuid, membroUuid, {
      ...data,
      nome: data.nome?.trim(),
    });
  }
}
