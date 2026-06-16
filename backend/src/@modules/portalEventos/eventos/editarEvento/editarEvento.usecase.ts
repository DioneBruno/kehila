import { ApiError } from "src/@modules/shared/apiError";
import { EditarEventoRepository } from "./editarEventoRepository";

export type EditarEventoInput = {
  companyUuid: string;
  eventoUuid: string;
  titulo?: string;
  descricao?: string;
  bannerUrl?: string;
  dataInicio?: string;
  dataFim?: string;
  capacidadeTotal?: number;
  localNome?: string;
  localEndereco?: string;
  localLat?: number;
  localLng?: number;
  online?: boolean;
  linkOnline?: string;
  suporteEmail?: string;
  suporteTelefone?: string;
};

const STATUS_EDITAVEIS = ["rascunho", "publicado"];

export class EditarEventoUsecase {
  constructor(readonly repo: EditarEventoRepository) {}

  async execute(input: EditarEventoInput): Promise<void> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.eventoUuid) throw new ApiError("UUID do evento é obrigatório");

    const status = await this.repo.buscarStatus(input.companyUuid, input.eventoUuid);
    if (!status) throw new ApiError("Evento não encontrado", 404);
    if (!STATUS_EDITAVEIS.includes(status)) {
      throw new ApiError(`Evento com status "${status}" não pode ser editado`);
    }

    if (input.online === true && input.linkOnline === "") {
      throw new ApiError("Informe o link do evento online");
    }

    await this.repo.atualizar(input.companyUuid, input.eventoUuid, {
      titulo: input.titulo,
      descricao: input.descricao,
      bannerUrl: input.bannerUrl,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      capacidadeTotal: input.capacidadeTotal,
      localNome: input.localNome,
      localEndereco: input.localEndereco,
      localLat: input.localLat,
      localLng: input.localLng,
      online: input.online,
      linkOnline: input.linkOnline,
      suporteEmail: input.suporteEmail,
      suporteTelefone: input.suporteTelefone,
    });
  }
}
