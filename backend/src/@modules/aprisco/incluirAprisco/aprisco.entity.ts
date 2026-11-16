import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";

export type ApriscoStatus = "ativo" | "inativo";

export const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export type ApriscoProps = {
  uuid: string;
  companyUuid: string;
  nome: string;
  diaSemana?: DiaSemana | null;
  /** HH:MM (24h) */
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

export function validarDiaSemanaAprisco(diaSemana: string | null): void {
  if (diaSemana !== null && !DIAS_SEMANA.includes(diaSemana as DiaSemana)) {
    throw new ApiError(`Dia da semana inválido. Use: ${DIAS_SEMANA.join(", ")}`);
  }
}

const HORARIO_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Normaliza o horário para HH:MM (aceita "8:30"). Vazio vira null. */
export function normalizarHorarioAprisco(horario: string | null | undefined): string | null {
  const texto = horario?.trim();
  if (!texto) return null;
  const normalizado = /^\d:\d{2}$/.test(texto) ? `0${texto}` : texto;
  if (!HORARIO_REGEX.test(normalizado)) throw new ApiError("Horário inválido. Use o formato HH:MM");
  return normalizado;
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

    const diaSemana = input.diaSemana || null;
    validarDiaSemanaAprisco(diaSemana);
    const horario = normalizarHorarioAprisco(input.horario);

    return new ApriscoEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      nome: input.nome.trim(),
      diaSemana,
      horario,
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
