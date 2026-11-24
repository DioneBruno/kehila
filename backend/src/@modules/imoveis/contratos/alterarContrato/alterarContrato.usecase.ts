import { ApiError } from "src/@modules/shared/apiError";
import { textoOpcional } from "../../pessoas/pessoa.entity";
import { garantirUuid } from "../../shared/garantirUuid";
import { GarantiaTipo, IndiceReajuste } from "../../shared/imoveis.tipos";
import {
  mesDoInicio,
  MSG_CONTRATO_NAO_ENCONTRADO,
  resolverFiador,
  validarData,
  validarDescontoPontualidade,
  validarDiaVencimento,
  validarFimPosteriorInicio,
  validarGarantiaTipo,
  validarGarantiaValor,
  validarIndiceReajuste,
  validarJurosMes,
  validarMesReajuste,
  validarMultaAtraso,
  validarMultaRescisoria,
} from "../contrato.entity";
import { AlterarContratoColunas, AlterarContratoRepository, ContratoParaAlterar } from "./alterarContratoRepository";

/**
 * Campos ausentes (undefined) não mudam; null limpa os opcionais.
 * fim e valorAluguel só mudam por renovação/aditivo; status por encerramento/rescisão; imóvel e inquilino nunca.
 */
export type AlterarContratoInput = {
  companyUuid: string;
  uuid: string;
  numero?: string | null;
  inicio?: string;
  diaVencimento?: number;
  indiceReajuste?: IndiceReajuste;
  mesReajuste?: number | null;
  multaAtrasoPct?: number;
  jurosMesPct?: number;
  descontoPontualidadePct?: number | null;
  multaRescisoriaMeses?: number | null;
  garantiaTipo?: GarantiaTipo;
  garantiaValor?: number | null;
  fiadorUuid?: string | null;
  observacoes?: string | null;
};

const opcional = (valor: string | null | undefined) => (valor === undefined ? undefined : textoOpcional(valor));

export class AlterarContratoUsecase {
  constructor(readonly repo: AlterarContratoRepository) {}

  async execute(input: AlterarContratoInput): Promise<void> {
    const proibidos = input as Record<string, unknown>;
    if (proibidos.fim !== undefined || proibidos.valorAluguel !== undefined) {
      throw new ApiError("Use renovação ou aditivo para alterar valor ou data de fim");
    }
    if (proibidos.status !== undefined || proibidos.imovelUuid !== undefined || proibidos.inquilinoUuid !== undefined) {
      throw new ApiError("Não é possível alterar o imóvel, o inquilino ou o status do contrato");
    }
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, MSG_CONTRATO_NAO_ENCONTRADO);

    // Validações que não dependem do contrato atual, antes de abrir a transação.
    const inicio = input.inicio === undefined ? undefined : validarData(input.inicio, "Data de início inválida");
    const indiceReajuste = input.indiceReajuste === undefined ? undefined : validarIndiceReajuste(input.indiceReajuste);
    const mesReajuste = input.mesReajuste === undefined ? undefined : validarMesReajuste(input.mesReajuste);
    const garantiaTipo = input.garantiaTipo === undefined ? undefined : validarGarantiaTipo(input.garantiaTipo);
    const fixas: AlterarContratoColunas = {
      numero: opcional(input.numero),
      inicio,
      dia_vencimento: input.diaVencimento === undefined ? undefined : validarDiaVencimento(input.diaVencimento),
      indice_reajuste: indiceReajuste,
      mes_reajuste: mesReajuste,
      multa_atraso_pct: input.multaAtrasoPct === undefined ? undefined : validarMultaAtraso(input.multaAtrasoPct),
      juros_mes_pct: input.jurosMesPct === undefined ? undefined : validarJurosMes(input.jurosMesPct),
      desconto_pontualidade_pct: input.descontoPontualidadePct === undefined ? undefined : validarDescontoPontualidade(input.descontoPontualidadePct),
      multa_rescisoria_meses: input.multaRescisoriaMeses === undefined ? undefined : validarMultaRescisoria(input.multaRescisoriaMeses),
      garantia_tipo: garantiaTipo,
      garantia_valor: input.garantiaValor === undefined ? undefined : validarGarantiaValor(input.garantiaValor),
      observacoes: opcional(input.observacoes),
    };

    const montar = (atual: ContratoParaAlterar): AlterarContratoColunas => {
      const colunas: AlterarContratoColunas = { ...fixas };
      if (inicio !== undefined) validarFimPosteriorInicio(inicio, atual.fim);

      // Ao passar a ter índice sem mês definido, o mês padrão é o do início.
      if (indiceReajuste !== undefined && indiceReajuste !== "nenhum" && mesReajuste === undefined && atual.mesReajuste === null) {
        colunas.mes_reajuste = mesDoInicio(inicio ?? atual.inicio);
      }

      if (garantiaTipo !== undefined || input.fiadorUuid !== undefined) {
        const tipoFinal = garantiaTipo ?? atual.garantiaTipo;
        const fiador = input.fiadorUuid !== undefined ? input.fiadorUuid : atual.fiadorUuid;
        colunas.fiador_uuid = resolverFiador(tipoFinal, fiador, atual.inquilinoUuid);
      }
      return colunas;
    };

    await this.repo.alterar(input.companyUuid, uuid, montar);
  }
}
