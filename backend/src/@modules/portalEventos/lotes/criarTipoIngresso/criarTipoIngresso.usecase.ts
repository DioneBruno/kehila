import { ApiError } from "src/@modules/shared/apiError";
import { CriarTipoIngressoRepository, TipoIngressoCriado } from "./criarTipoIngressoRepository";

export type CriarTipoIngressoInput = {
  companyUuid: string;
  loteUuid: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  gerarQuantidadeIngressos: number;
  preco: number;
  visivel?: boolean;
};

export class CriarTipoIngressoUsecase {
  constructor(readonly repo: CriarTipoIngressoRepository) {}

  async execute(input: CriarTipoIngressoInput): Promise<TipoIngressoCriado> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.loteUuid) throw new ApiError("Lote não informado");
    if (!input.nome?.trim()) throw new ApiError("O nome do tipo de ingresso é obrigatório");
    if (input.quantidade == null || input.quantidade < 0) throw new ApiError("Quantidade permitida");
    if (input.preco == null || input.preco < 0) throw new ApiError("O preço não pode ser negativo");

    const lote = await this.repo.loteExiste(input.loteUuid, input.companyUuid);
    if (!lote) throw new ApiError("Lote não encontrado", 404);

    return this.repo.criar({
      companyUuid: input.companyUuid,
      eventoUuid: lote.eventoUuid,
      loteUuid: input.loteUuid,
      nome: input.nome.trim(),
      descricao: input.descricao,
      quantidade: input.quantidade,
      gerarQuantidadeIngressos: input.gerarQuantidadeIngressos ?? 1,
      preco: input.preco,
      visivel: input.visivel ?? true,
    });
  }
}
