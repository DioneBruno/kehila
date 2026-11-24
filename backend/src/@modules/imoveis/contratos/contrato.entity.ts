import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { textoOpcional } from "../pessoas/pessoa.entity";
import { garantirUuid } from "../shared/garantirUuid";
import { GARANTIA_TIPOS, GarantiaTipo, INDICES_REAJUSTE, IndiceReajuste } from "../shared/imoveis.tipos";

export const MSG_IMOVEL_NAO_ENCONTRADO = "Imóvel não encontrado";
export const MSG_INQUILINO_NAO_ENCONTRADO = "Inquilino não encontrado";
export const MSG_FIADOR_NAO_ENCONTRADO = "Fiador não encontrado";
export const MSG_CONTRATO_NAO_ENCONTRADO = "Contrato não encontrado";
export const MSG_CONTRATO_NAO_VIGENTE = "Contrato não está vigente";
export const MSG_IMOVEL_NAO_LIVRE = "Imóvel não está livre para locação";
export const MSG_INQUILINO_PROPRIETARIO = "Inquilino não pode ser o proprietário do imóvel";
export const MSG_INFORME_FIADOR = "Informe o fiador";
export const MSG_FIADOR_INQUILINO = "Fiador não pode ser o inquilino";
export const MSG_FIM_ANTES_INICIO = "A data de fim deve ser posterior ao início";

/** Nome do índice único parcial que garante um contrato vigente por imóvel (rede de segurança do lock). */
export const UQ_CONTRATO_VIGENTE = "UQ_imovel_contratos_imovel_vigente";

const DATA_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Valida 'YYYY-MM-DD' (data real do calendário) e devolve a própria string; comparável lexicograficamente. */
export function validarData(valor: unknown, mensagem: string): string {
  if (typeof valor !== "string") throw new ApiError(mensagem);
  const m = DATA_REGEX.exec(valor);
  if (!m) throw new ApiError(mensagem);
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) throw new ApiError(mensagem);
  return valor;
}

export function validarFimPosteriorInicio(inicio: string, fim: string): void {
  if (!(fim > inicio)) throw new ApiError(MSG_FIM_ANTES_INICIO);
}

/** Número >= 0 abaixo de `limite`, arredondado em `casas` casas decimais. */
function validarNumero(valor: unknown, mensagem: string, limite: number, casas: number): number {
  if (valor === null || valor === undefined || valor === "" || typeof valor === "boolean") throw new ApiError(mensagem);
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0 || numero >= limite) throw new ApiError(mensagem);
  const fator = 10 ** casas;
  return Math.round(numero * fator) / fator;
}

function numeroOpcional(valor: unknown, mensagem: string, limite: number, casas: number): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  return validarNumero(valor, mensagem, limite, casas);
}

export const validarValorAluguel = (valor: unknown) => validarNumero(valor, "Valor do aluguel inválido", 1e10, 2);
export const validarGarantiaValor = (valor: unknown) => numeroOpcional(valor, "Valor da garantia inválido", 1e10, 2);
export const validarMultaAtraso = (valor: unknown) => validarNumero(valor, "Multa por atraso inválida", 1000, 2);
export const validarJurosMes = (valor: unknown) => validarNumero(valor, "Juros ao mês inválidos", 1000, 2);
export const validarDescontoPontualidade = (valor: unknown) => numeroOpcional(valor, "Desconto de pontualidade inválido", 1000, 2);
export const validarMultaRescisoria = (valor: unknown) => numeroOpcional(valor, "Multa rescisória inválida", 1000, 1);

export function validarDiaVencimento(valor: unknown): number {
  const numero = Number(valor);
  if (valor === null || valor === "" || typeof valor === "boolean" || !Number.isInteger(numero) || numero < 1 || numero > 31) {
    throw new ApiError("Dia de vencimento inválido");
  }
  return numero;
}

export function validarIndiceReajuste(valor: unknown): IndiceReajuste {
  if (!INDICES_REAJUSTE.includes(valor as IndiceReajuste)) throw new ApiError("Índice de reajuste inválido");
  return valor as IndiceReajuste;
}

export function validarMesReajuste(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  if (typeof valor === "boolean" || !Number.isInteger(numero) || numero < 1 || numero > 12) throw new ApiError("Mês de reajuste inválido");
  return numero;
}

export function validarGarantiaTipo(valor: unknown): GarantiaTipo {
  if (!GARANTIA_TIPOS.includes(valor as GarantiaTipo)) throw new ApiError("Tipo de garantia inválido");
  return valor as GarantiaTipo;
}

/** Mês do início, usado como mês de reajuste padrão quando há índice. */
export const mesDoInicio = (inicio: string) => Number(inicio.slice(5, 7));

/** Fiador só existe com garantia 'fiador': obrigatório e diferente do inquilino. Nas demais garantias, fica nulo. */
export function resolverFiador(garantiaTipo: GarantiaTipo, fiadorUuid: unknown, inquilinoUuid: string): string | null {
  if (garantiaTipo !== "fiador") return null;
  if (fiadorUuid === null || fiadorUuid === undefined || fiadorUuid === "") throw new ApiError(MSG_INFORME_FIADOR);
  const uuid = garantirUuid(fiadorUuid, MSG_FIADOR_NAO_ENCONTRADO);
  if (uuid === inquilinoUuid) throw new ApiError(MSG_FIADOR_INQUILINO);
  return uuid;
}

export type ContratoProps = {
  uuid: string;
  companyUuid: string;
  imovelUuid: string;
  inquilinoUuid: string;
  numero: string | null;
  inicio: string;
  fim: string;
  valorAluguel: number;
  diaVencimento: number;
  indiceReajuste: IndiceReajuste;
  mesReajuste: number | null;
  multaAtrasoPct: number;
  jurosMesPct: number;
  descontoPontualidadePct: number | null;
  multaRescisoriaMeses: number | null;
  garantiaTipo: GarantiaTipo;
  garantiaValor: number | null;
  fiadorUuid: string | null;
  observacoes: string | null;
};

export type CriarContratoProps = {
  companyUuid: string;
  imovelUuid: string;
  inquilinoUuid: string;
  inicio: string;
  fim: string;
  valorAluguel: number;
  diaVencimento: number;
  indiceReajuste: IndiceReajuste;
  mesReajuste?: number | null;
  multaAtrasoPct?: number | null;
  jurosMesPct?: number | null;
  descontoPontualidadePct?: number | null;
  multaRescisoriaMeses?: number | null;
  garantiaTipo: GarantiaTipo;
  garantiaValor?: number | null;
  fiadorUuid?: string | null;
  numero?: string | null;
  observacoes?: string | null;
};

export class ContratoEntity {
  constructor(readonly props: ContratoProps) {}

  static criar(input: CriarContratoProps): ContratoEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const imovelUuid = garantirUuid(input.imovelUuid, MSG_IMOVEL_NAO_ENCONTRADO);
    const inquilinoUuid = garantirUuid(input.inquilinoUuid, MSG_INQUILINO_NAO_ENCONTRADO);
    const inicio = validarData(input.inicio, "Data de início inválida");
    const fim = validarData(input.fim, "Data de fim inválida");
    validarFimPosteriorInicio(inicio, fim);
    const indiceReajuste = validarIndiceReajuste(input.indiceReajuste);
    const mesInformado = validarMesReajuste(input.mesReajuste);
    const garantiaTipo = validarGarantiaTipo(input.garantiaTipo);

    return new ContratoEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      imovelUuid,
      inquilinoUuid,
      numero: textoOpcional(input.numero),
      inicio,
      fim,
      valorAluguel: validarValorAluguel(input.valorAluguel),
      diaVencimento: validarDiaVencimento(input.diaVencimento),
      indiceReajuste,
      mesReajuste: mesInformado ?? (indiceReajuste !== "nenhum" ? mesDoInicio(inicio) : null),
      multaAtrasoPct: input.multaAtrasoPct === undefined || input.multaAtrasoPct === null ? 2 : validarMultaAtraso(input.multaAtrasoPct),
      jurosMesPct: input.jurosMesPct === undefined || input.jurosMesPct === null ? 1 : validarJurosMes(input.jurosMesPct),
      descontoPontualidadePct: validarDescontoPontualidade(input.descontoPontualidadePct),
      multaRescisoriaMeses: validarMultaRescisoria(input.multaRescisoriaMeses),
      garantiaTipo,
      garantiaValor: validarGarantiaValor(input.garantiaValor),
      fiadorUuid: resolverFiador(garantiaTipo, input.fiadorUuid, inquilinoUuid),
      observacoes: textoOpcional(input.observacoes),
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}

/** pg 23505 no índice único de contrato vigente (QueryFailedError do TypeORM copia os campos do driver). */
export function ehViolacaoContratoVigente(erro: any): boolean {
  const code = erro?.code ?? erro?.driverError?.code;
  const constraint = erro?.constraint ?? erro?.driverError?.constraint;
  return code === "23505" && constraint === UQ_CONTRATO_VIGENTE;
}
