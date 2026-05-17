import { ApiError } from "src/@modules/shared/apiError";
import { CriarEventoRepository, EventoCriado } from "./criarEventoRepository";

export type CriarEventoInput = {
  companyUuid: string;
  userUuid: string;
  titulo: string;
  descricao?: string;
  bannerUrl?: string;
  dataInicio: string;
  dataFim?: string;
  capacidadeTotal?: number;
  localNome?: string;
  localEndereco?: string;
  localLat?: number;
  localLng?: number;
  online?: boolean;
  linkOnline?: string;
};

function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export class CriarEventoUsecase {
  constructor(readonly repo: CriarEventoRepository) {}

  async execute(input: CriarEventoInput): Promise<EventoCriado> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.userUuid) throw new ApiError("Usuário não identificado", 401);
    if (!input.titulo?.trim()) throw new ApiError("O título do evento é obrigatório");
    if (!input.dataInicio) throw new ApiError("A data de início é obrigatória");
    if (input.online && !input.linkOnline) throw new ApiError("Informe o link do evento online");

    const baseSlug = gerarSlug(input.titulo);
    let slug = baseSlug;
    let tentativa = 0;

    while (await this.repo.slugExiste(slug)) {
      tentativa++;
      slug = `${baseSlug}-${tentativa}`;
    }

    return this.repo.criar({
      companyUuid: input.companyUuid,
      userUuid: input.userUuid,
      titulo: input.titulo.trim(),
      slug,
      descricao: input.descricao,
      bannerUrl: input.bannerUrl,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      capacidadeTotal: input.capacidadeTotal,
      localNome: input.localNome,
      localEndereco: input.localEndereco,
      localLat: input.localLat,
      localLng: input.localLng,
      online: input.online ?? false,
      linkOnline: input.linkOnline,
    });
  }
}
