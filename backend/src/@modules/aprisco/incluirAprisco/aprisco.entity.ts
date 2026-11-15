import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";

export type ApriscoStatus = "ativo" | "inativo";

export type ApriscoProps = {
  uuid: string;
  companyUuid: string;
  nome: string;
  horario?: string | null;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: ApriscoStatus;
};

export type CriarApriscoProps = Omit<ApriscoProps, "uuid" | "status"> & Partial<Pick<ApriscoProps, "status">>;

const STATUS_VALIDOS: ApriscoStatus[] = ["ativo", "inativo"];

export function validarStatusAprisco(status: ApriscoStatus): void {
  if (!STATUS_VALIDOS.includes(status)) throw new ApiError("Status do aprisco inválido");
}

export function validarCoordenadasAprisco(latitude: number | null, longitude: number | null): void {
  if ((latitude === null) !== (longitude === null)) {
    throw new ApiError("Latitude e longitude devem ser informadas juntas");
  }
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    throw new ApiError("Latitude inválida");
  }
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    throw new ApiError("Longitude inválida");
  }
}

export class ApriscoEntity {
  constructor(readonly props: ApriscoProps) {}

  static criar(input: CriarApriscoProps): ApriscoEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.nome?.trim()) throw new ApiError("O nome do aprisco é obrigatório");

    const status = input.status ?? "ativo";
    validarStatusAprisco(status);

    const latitude = input.latitude ?? null;
    const longitude = input.longitude ?? null;
    validarCoordenadasAprisco(latitude, longitude);

    return new ApriscoEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      nome: input.nome.trim(),
      horario: input.horario?.trim() || null,
      endereco: input.endereco?.trim() || null,
      latitude,
      longitude,
      status,
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}
