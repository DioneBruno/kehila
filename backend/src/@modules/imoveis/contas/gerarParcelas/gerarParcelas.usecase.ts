import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { avancarCompetencia, calcularVencimentosParcelas, MSG_QUANTIDADE_PARCELAS, validarDadosConta } from "../conta.entity";
import { IncluirContaRepository } from "../incluirConta/incluirContaRepository";

export type GerarParcelasInput = { companyUuid: string } & Record<string, unknown>;

export class GerarParcelasUsecase {
  constructor(readonly repo: IncluirContaRepository) {}

  /** Gera `quantidade` contas mensais (mesmo dia) em um grupo; pagoEm/valorPago são ignorados (parcelas nascem em aberto). */
  async execute(input: GerarParcelasInput): Promise<{ uuids: string[]; grupoUuid: string }> {
    const dados = validarDadosConta({ ...input, vencimento: input.primeiroVencimento, valor: input.valorParcela });
    const quantidade = input.quantidade;
    if (typeof quantidade !== "number" || !Number.isInteger(quantidade) || quantidade < 2 || quantidade > 60) {
      throw new ApiError(MSG_QUANTIDADE_PARCELAS);
    }
    const vencimentos = calcularVencimentosParcelas(dados.vencimento, quantidade);
    const grupoUuid = randomUUID();
    const linhas = vencimentos.map((vencimento, i) => ({
      ...dados,
      vencimento,
      competencia: dados.competencia ? avancarCompetencia(dados.competencia, i) : null,
      uuid: randomUUID(),
      proprietarioUuid: dados.proprietarioUuid ?? "",
      pagoEm: null,
      valorPago: null,
      grupoUuid,
      parcelaNumero: i + 1,
      parcelaTotal: quantidade,
    }));
    await this.repo.incluir(input.companyUuid, linhas);
    return { uuids: linhas.map((l) => l.uuid), grupoUuid };
  }
}
