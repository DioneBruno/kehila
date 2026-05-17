import { ApiError } from "src/@modules/shared/apiError";
import { ListarLotesRepository, Lote } from "./listarLotesRepository";

export type ListarLotesInput = {
  companyUuid: string;
  eventoUuid: string;
};

export class ListarLotesUsecase {
  constructor(readonly repo: ListarLotesRepository) {}

  async execute(input: ListarLotesInput): Promise<Lote[]> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.eventoUuid) throw new ApiError("Evento não informado");

    return this.repo.listar(input.eventoUuid, input.companyUuid);
  }
}
