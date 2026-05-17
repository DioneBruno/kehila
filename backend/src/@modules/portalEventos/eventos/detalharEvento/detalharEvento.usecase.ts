import { ApiError } from "src/@modules/shared/apiError";
import { DetalharEventoRepository, EventoDetalhe } from "./detalharEventoRepository";

export type DetalharEventoInput = {
  companyUuid: string;
  eventoUuid: string;
};

export class DetalharEventoUsecase {
  constructor(readonly repo: DetalharEventoRepository) {}

  async execute(input: DetalharEventoInput): Promise<EventoDetalhe> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.eventoUuid) throw new ApiError("UUID do evento é obrigatório");

    const evento = await this.repo.buscarPorUuid(input.companyUuid, input.eventoUuid);
    if (!evento) throw new ApiError("Evento não encontrado", 404);

    return evento;
  }
}
