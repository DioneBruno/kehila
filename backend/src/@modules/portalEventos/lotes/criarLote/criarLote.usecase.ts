import { ApiError } from "src/@modules/shared/apiError";
import { CriarLoteRepository, LoteCriado } from "./criarLoteRepository";

export type CriarLoteInput = {
  companyUuid: string;
  eventoUuid: string;
  nome: string;
  ordem?: number;
  quantidade: number;
  preco: number;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
};

export class CriarLoteUsecase {
  constructor(readonly repo: CriarLoteRepository) {}

  async execute(input: CriarLoteInput): Promise<LoteCriado> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.eventoUuid) throw new ApiError("Evento não informado");
    if (!input.nome?.trim()) throw new ApiError("O nome do lote é obrigatório");
    if (input.quantidade == null || input.quantidade < 0) throw new ApiError("Quantidade permitida");
    if (input.preco == null || input.preco < 0) throw new ApiError("A data de início deve ser anterior à data de fim");

    const eventoExiste = await this.repo.eventoExiste(input.eventoUuid, input.companyUuid);
    if (!eventoExiste) throw new ApiError("Evento não encontrado", 404);

    const ordem = input.ordem ?? (await this.repo.proximaOrdem(input.eventoUuid));

    return this.repo.criar({
      companyUuid: input.companyUuid,
      eventoUuid: input.eventoUuid,
      nome: input.nome.trim(),
      ordem,
      quantidade: input.quantidade,
      preco: input.preco,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      ativo: input.ativo ?? true,
    });
  }
}
