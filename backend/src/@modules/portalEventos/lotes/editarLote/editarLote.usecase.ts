import { ApiError } from "src/@modules/shared/apiError";
import { EditarLoteRepository } from "./editarLoteRepository";

export type EditarLoteInput = {
  companyUuid: string;
  loteUuid: string;
  nome: string;
  ordem: number;
  quantidade: number;
  preco: number;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
};

export class EditarLoteUsecase {
  constructor(readonly repo: EditarLoteRepository) {}

  async execute(input: EditarLoteInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.loteUuid) throw new ApiError("Lote não informado");
    if (!input.nome?.trim()) throw new ApiError("O nome do lote é obrigatório");
    if (input.quantidade == null || input.quantidade < 0) throw new ApiError("Quantidade permitida");
    if (input.preco == null || input.preco < 0) throw new ApiError("O preço não pode ser negativo");
    if (input.dataInicio && input.dataFim && input.dataInicio >= input.dataFim)
      throw new ApiError("A data de início deve ser anterior à data de fim");

    const lote = await this.repo.buscar(input.loteUuid, input.companyUuid);
    if (!lote) throw new ApiError("Lote não encontrado", 404);

    if (input.quantidade < lote.vendidosTotal)
      throw new ApiError(`A quantidade não pode ser menor que os ingressos já vendidos (${lote.vendidosTotal})`);

    await this.repo.editar({
      uuid: input.loteUuid,
      companyUuid: input.companyUuid,
      nome: input.nome.trim(),
      ordem: input.ordem,
      quantidade: input.quantidade,
      preco: input.preco,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      ativo: input.ativo ?? true,
    });
  }
}
