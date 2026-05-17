import { ApiError } from "src/@modules/shared/apiError";
import { EditarTipoIngressoRepository } from "./editarTipoIngressoRepository";

export type EditarTipoIngressoInput = {
  companyUuid: string;
  tipoUuid: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco: number;
  visivel?: boolean;
};

export class EditarTipoIngressoUsecase {
  constructor(readonly repo: EditarTipoIngressoRepository) {}

  async execute(input: EditarTipoIngressoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.tipoUuid) throw new ApiError("Tipo de ingresso não informado");
    if (!input.nome?.trim()) throw new ApiError("O nome do tipo de ingresso é obrigatório");
    if (input.quantidade == null || input.quantidade <= 0)
      throw new ApiError("A quantidade deve ser maior que zero");
    if (input.preco == null || input.preco < 0)
      throw new ApiError("O preço não pode ser negativo");

    const tipo = await this.repo.buscar(input.tipoUuid, input.companyUuid);
    if (!tipo) throw new ApiError("Tipo de ingresso não encontrado", 404);

    if (input.quantidade < tipo.vendidos)
      throw new ApiError(
        `A quantidade não pode ser menor que os ingressos já vendidos (${tipo.vendidos})`,
      );

    await this.repo.editar({
      uuid: input.tipoUuid,
      companyUuid: input.companyUuid,
      nome: input.nome.trim(),
      descricao: input.descricao,
      quantidade: input.quantidade,
      preco: input.preco,
      visivel: input.visivel ?? true,
    });
  }
}
