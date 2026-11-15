import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";

export const TIPOS_PRESENCA = ["INTEGRANTE", "CRIANCA", "VISITANTE"] as const;

export type TipoPresenca = (typeof TIPOS_PRESENCA)[number];

export type PresencaProps = {
  uuid: string;
  companyUuid: string;
  apriscoUuid: string;
  tipo: TipoPresenca;
  pessoaUuid: string | null;
  /** YYYY-MM-DD */
  dataReuniao: string;
  presenca: boolean;
  quantidade: number | null;
};

export type CriarPresencaProps = {
  companyUuid: string;
  apriscoUuid: string;
  tipo: string;
  pessoaUuid?: string | null;
  dataReuniao: string;
  presenca?: boolean | null;
  quantidade?: number | null;
};

export function normalizarTipoPresenca(tipo: string | null | undefined): TipoPresenca {
  const normalizado = (tipo ?? "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase() as TipoPresenca;
  if (!TIPOS_PRESENCA.includes(normalizado)) {
    throw new ApiError(`Tipo de presença inválido. Valores aceitos: ${TIPOS_PRESENCA.join(", ")}`);
  }
  return normalizado;
}

export function validarDataReuniao(data: string | null | undefined): string {
  const valor = data?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw new ApiError("Data da reunião inválida. Use o formato AAAA-MM-DD");
  const date = new Date(`${valor}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== valor) {
    throw new ApiError("Data da reunião inválida. Use o formato AAAA-MM-DD");
  }
  return valor;
}

export class PresencaEntity {
  constructor(readonly props: PresencaProps) {}

  static criar(input: CriarPresencaProps): PresencaEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!input.apriscoUuid) throw new ApiError("Aprisco não identificado");

    const tipo = normalizarTipoPresenca(input.tipo);
    const dataReuniao = validarDataReuniao(input.dataReuniao);
    const pessoaUuid = input.pessoaUuid?.trim() || null;
    const presenca = input.presenca ?? true;

    let quantidade: number | null = null;
    if (tipo === "INTEGRANTE") {
      if (!pessoaUuid) throw new ApiError("Pessoa não identificada");
    } else {
      // Criança / visitante: contagem. Com pessoa identificada, conta como 1.
      quantidade = input.quantidade ?? (pessoaUuid ? 1 : null);
      if (quantidade === null) throw new ApiError("A quantidade é obrigatória para crianças e visitantes");
      if (!Number.isInteger(quantidade) || quantidade < 0) throw new ApiError("Quantidade inválida");
    }

    return new PresencaEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      apriscoUuid: input.apriscoUuid,
      tipo,
      pessoaUuid,
      dataReuniao,
      presenca,
      quantidade,
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}
