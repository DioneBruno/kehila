import { ApiError } from "src/@modules/shared/apiError";
import { validarCoordenadasAprisco, validarStatusAprisco } from "../incluirAprisco/aprisco.entity";
import { AlterarApriscoData, AlterarApriscoRepository } from "./alterarApriscoRepository";

export type AlterarApriscoInput = AlterarApriscoData & {
  companyUuid: string;
  apriscoUuid: string;
};

const textoOpcional = (valor: string | null | undefined) => (valor === undefined ? undefined : valor?.trim() || null);

export class AlterarApriscoUsecase {
  constructor(readonly repo: AlterarApriscoRepository) {}

  async execute(input: AlterarApriscoInput): Promise<void> {
    const { companyUuid, apriscoUuid, ...data } = input;

    if (!companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!apriscoUuid) throw new ApiError("Aprisco não identificado");
    if (data.nome !== undefined && !data.nome?.trim()) throw new ApiError("O nome do aprisco é obrigatório");
    if (data.status !== undefined) validarStatusAprisco(data.status);

    // Coordenadas são alteradas sempre em par (null nas duas para remover)
    if (data.latitude !== undefined || data.longitude !== undefined) {
      validarCoordenadasAprisco(data.latitude ?? null, data.longitude ?? null);
    }

    const existe = await this.repo.existe(companyUuid, apriscoUuid);
    if (!existe) throw new ApiError("Aprisco não encontrado", 404);

    await this.repo.alterar(companyUuid, apriscoUuid, {
      ...data,
      nome: data.nome?.trim(),
      horario: textoOpcional(data.horario),
      endereco: textoOpcional(data.endereco),
    });
  }
}
