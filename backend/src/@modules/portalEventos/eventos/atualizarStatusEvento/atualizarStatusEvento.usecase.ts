import { ApiError } from "src/@modules/shared/apiError";
import { AtualizarStatusEventoRepository } from "./atualizarStatusEventoRepository";

export type AtualizarStatusEventoInput = {
  companyUuid: string;
  eventoUuid: string;
  acao: "publicar" | "cancelar" | "encerrar";
};

const TRANSICOES: Record<string, Record<string, string>> = {
  publicar: { rascunho: "publicado" },
  cancelar: { rascunho: "cancelado", publicado: "cancelado", em_vendas: "cancelado" },
  encerrar: { em_vendas: "encerrado", publicado: "encerrado" },
};

export class AtualizarStatusEventoUsecase {
  constructor(readonly repo: AtualizarStatusEventoRepository) {}

  async execute(input: AtualizarStatusEventoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.eventoUuid) throw new ApiError("UUID do evento é obrigatório");

    const statusAtual = await this.repo.buscarStatus(input.companyUuid, input.eventoUuid);
    if (!statusAtual) throw new ApiError("Evento não encontrado", 404);

    const transicoesDaAcao = TRANSICOES[input.acao];
    const novoStatus = transicoesDaAcao?.[statusAtual];

    if (!novoStatus) {
      throw new ApiError(`Não é possível ${input.acao} um evento com status "${statusAtual}"`);
    }

    await this.repo.atualizarStatus(input.companyUuid, input.eventoUuid, novoStatus);
  }
}
