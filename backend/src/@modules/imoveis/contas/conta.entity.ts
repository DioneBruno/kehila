import { ApiError } from "src/@modules/shared/apiError";
import { MSG_CONTRATO_NAO_ENCONTRADO, MSG_IMOVEL_NAO_ENCONTRADO, validarData } from "../contratos/contrato.entity";
import { textoOpcional } from "../pessoas/pessoa.entity";
import { garantirUuid } from "../shared/garantirUuid";
import {
  CATEGORIAS_POR_TIPO,
  CONTA_ESFERAS,
  CONTA_RESPONSAVEIS,
  CONTA_TIPOS,
  ContaEsfera,
  ContaResponsavel,
  ContaSituacao,
  ContaTipo,
} from "../shared/imoveis.tipos";

export const MSG_CONTA_NAO_ENCONTRADA = "Conta não encontrada";
export const MSG_TIPO_INVALIDO = "Tipo de conta inválido";
export const MSG_CATEGORIA_INVALIDA = "Categoria inválida para o tipo";
export const MSG_INFORME_ESFERA = "Informe a esfera da guia";
export const MSG_ESFERA_SO_GUIA = "Esfera só se aplica a guias";
export const MSG_ESFERA_INVALIDA = "Esfera inválida";
export const MSG_INFORME_DESCRICAO = "Informe a descrição";
export const MSG_INFORME_PROPRIETARIO = "Informe o proprietário";
export const MSG_PROPRIETARIO_NAO_ENCONTRADO = "Proprietário não encontrado";
export const MSG_NAO_PROPRIETARIO = "A pessoa não é proprietária";
export const MSG_CONTRATO_SEM_IMOVEL = "Informe o imóvel do contrato";
export const MSG_CONTRATO_OUTRO_IMOVEL = "O contrato não é deste imóvel";
export const MSG_INQUILINO_SEM_CONTRATO = "Informe o contrato quando o inquilino paga";
export const MSG_RESPONSAVEL_INVALIDO = "Responsável inválido";
export const MSG_VENCIMENTO_INVALIDO = "Vencimento inválido";
export const MSG_VALOR_INVALIDO = "Valor inválido";
export const MSG_COMPETENCIA_INVALIDA = "Competência inválida";
export const MSG_PAGO_EM_INVALIDO = "Data de pagamento inválida";
export const MSG_PAGO_EM_FUTURO = "A data de pagamento não pode ser futura";
export const MSG_VALOR_PAGO_INVALIDO = "Valor pago inválido";
export const MSG_CONTA_JA_PAGA = "Conta já está paga";
export const MSG_CONTA_NAO_PAGA = "Conta não está paga";
export const MSG_QUANTIDADE_PARCELAS = "A quantidade de parcelas deve ser entre 2 e 60";
export const MSG_PESSOA_COM_CONTAS = "Não é possível excluir: há contas lançadas para esta pessoa";
export const MSG_IMOVEL_COM_CONTAS = "Não é possível excluir imóvel com contas lançadas";
export const MSG_ENVIE_ARQUIVO = "Envie um arquivo";
export const MSG_ARQUIVO_GRANDE = "O arquivo deve ter no máximo 10 MB";
export const MSG_FORMATO_ANEXO = "Formato inválido. Use PDF, PNG ou JPG";
export const MSG_TIPO_ANEXO_INVALIDO = "Tipo de anexo inválido";
export const MSG_ANEXO_NAO_ENCONTRADO = "Anexo não encontrado";

export type ContaDados = {
  tipo: ContaTipo;
  categoria: string;
  esfera: ContaEsfera | null;
  descricao: string | null;
  proprietarioUuid: string | null;
  imovelUuid: string | null;
  contratoUuid: string | null;
  responsavel: ContaResponsavel;
  competencia: string | null;
  vencimento: string;
  valor: number;
  fornecedor: string | null;
  documentoNumero: string | null;
  observacoes: string | null;
};

const vazio = (v: unknown) => v === null || v === undefined || v === "";
const texto = (v: unknown) => textoOpcional(typeof v === "string" ? v : null);

/** Número com ponto decimal (number ou string numérica), abaixo de 1e10, 2 casas; `permiteZero` aceita 0. */
function validarDinheiro(valor: unknown, mensagem: string, permiteZero: boolean): number {
  if (vazio(valor) || typeof valor === "boolean") throw new ApiError(mensagem);
  if (typeof valor !== "string" && typeof valor !== "number") throw new ApiError(mensagem);
  if (typeof valor === "string" && !/^\d+(\.\d+)?$/.test(valor.trim())) throw new ApiError(mensagem);
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero >= 1e10 || numero < 0) throw new ApiError(mensagem);
  const arredondado = Math.round(numero * 100) / 100;
  if (!permiteZero && arredondado <= 0) throw new ApiError(mensagem);
  return arredondado;
}

function uuidOpcional(valor: unknown, mensagem404: string): string | null {
  return vazio(valor) ? null : garantirUuid(valor, mensagem404);
}

export function validarDadosConta(input: Record<string, unknown>): ContaDados {
  if (!CONTA_TIPOS.includes(input.tipo as ContaTipo)) throw new ApiError(MSG_TIPO_INVALIDO);
  const tipo = input.tipo as ContaTipo;
  if (typeof input.categoria !== "string" || !CATEGORIAS_POR_TIPO[tipo].includes(input.categoria)) throw new ApiError(MSG_CATEGORIA_INVALIDA);
  const categoria = input.categoria;

  let esfera: ContaEsfera | null = null;
  if (tipo === "guia") {
    if (vazio(input.esfera)) throw new ApiError(MSG_INFORME_ESFERA);
    if (!CONTA_ESFERAS.includes(input.esfera as ContaEsfera)) throw new ApiError(MSG_ESFERA_INVALIDA);
    esfera = input.esfera as ContaEsfera;
  } else if (!vazio(input.esfera)) {
    throw new ApiError(MSG_ESFERA_SO_GUIA);
  }

  const descricao = texto(input.descricao);
  if (categoria === "outros" && !descricao) throw new ApiError(MSG_INFORME_DESCRICAO);

  const proprietarioUuid = uuidOpcional(input.proprietarioUuid, MSG_PROPRIETARIO_NAO_ENCONTRADO);
  const imovelUuid = uuidOpcional(input.imovelUuid, MSG_IMOVEL_NAO_ENCONTRADO);
  const contratoUuid = uuidOpcional(input.contratoUuid, MSG_CONTRATO_NAO_ENCONTRADO);
  if (contratoUuid && !imovelUuid) throw new ApiError(MSG_CONTRATO_SEM_IMOVEL);

  const responsavelBruto = vazio(input.responsavel) ? "proprietario" : input.responsavel;
  if (!CONTA_RESPONSAVEIS.includes(responsavelBruto as ContaResponsavel)) throw new ApiError(MSG_RESPONSAVEL_INVALIDO);
  const responsavel = responsavelBruto as ContaResponsavel;
  if (responsavel === "inquilino" && !contratoUuid) throw new ApiError(MSG_INQUILINO_SEM_CONTRATO);

  const vencimento = validarData(input.vencimento, MSG_VENCIMENTO_INVALIDO);
  const competencia = vazio(input.competencia) ? null : `${validarData(input.competencia, MSG_COMPETENCIA_INVALIDA).slice(0, 7)}-01`;

  return {
    tipo,
    categoria,
    esfera,
    descricao,
    proprietarioUuid,
    imovelUuid,
    contratoUuid,
    responsavel,
    competencia,
    vencimento,
    valor: validarDinheiro(input.valor, MSG_VALOR_INVALIDO, false),
    fornecedor: texto(input.fornecedor),
    documentoNumero: texto(input.documentoNumero),
    observacoes: texto(input.observacoes),
  };
}

export function validarPagamento(
  input: { pagoEm: unknown; valorPago?: unknown },
  valorConta: number,
  hoje: string,
): { pagoEm: string; valorPago: number } {
  const pagoEm = validarData(input.pagoEm, MSG_PAGO_EM_INVALIDO);
  if (pagoEm > hoje) throw new ApiError(MSG_PAGO_EM_FUTURO);
  const valorPago = vazio(input.valorPago) ? valorConta : validarDinheiro(input.valorPago, MSG_VALOR_PAGO_INVALIDO, true);
  return { pagoEm, valorPago };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Soma `meses` a uma data 'YYYY-MM-DD' mantendo o dia; se o mês não tem o dia, usa o último dia do mês. */
function somarMeses(data: string, meses: number): string {
  const ano = Number(data.slice(0, 4));
  const mes = Number(data.slice(5, 7)) - 1;
  const dia = Number(data.slice(8, 10));
  const total = ano * 12 + mes + meses;
  const a = Math.floor(total / 12);
  const m = total % 12;
  const ultimo = new Date(Date.UTC(a, m + 1, 0)).getUTCDate();
  return `${a}-${pad(m + 1)}-${pad(Math.min(dia, ultimo))}`;
}

/** Vencimentos mensais no mesmo dia do primeiro, sempre calculados a partir do primeiro (sem arrastar o dia). */
export function calcularVencimentosParcelas(primeiro: string, quantidade: number): string[] {
  return Array.from({ length: quantidade }, (_, i) => somarMeses(primeiro, i));
}

export function avancarCompetencia(competencia: string, meses: number): string {
  return somarMeses(competencia, meses);
}

export function situacaoConta(c: { pagoEm: string | null; vencimento: string }, hoje: string): ContaSituacao {
  if (c.pagoEm) return "paga";
  return c.vencimento < hoje ? "vencida" : "a_pagar";
}
