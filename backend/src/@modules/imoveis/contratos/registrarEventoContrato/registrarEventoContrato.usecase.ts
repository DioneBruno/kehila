import { ApiError } from "src/@modules/shared/apiError";
import { textoOpcional } from "../../pessoas/pessoa.entity";
import { garantirUuid } from "../../shared/garantirUuid";
import { CONTRATO_EVENTO_TIPOS, ContratoEventoTipo } from "../../shared/imoveis.tipos";
import { MSG_CONTRATO_NAO_ENCONTRADO, validarData, validarFimPosteriorInicio, validarValorAluguel } from "../contrato.entity";
import { ContratoAtual, EventoDecidido, RegistrarEventoContratoRepository } from "./registrarEventoContratoRepository";

export type RegistrarEventoContratoInput = {
  companyUuid: string;
  userUuid?: string | null;
  contratoUuid: string;
  tipo: ContratoEventoTipo;
  data: string;
  descricao: string;
  valorNovo?: number | null;
  fimNovo?: string | null;
};

export type RegistrarEventoContratoOutput = {
  uuid: string;
};

const vazio = (valor: unknown) => valor === undefined || valor === null || valor === "";

export class RegistrarEventoContratoUsecase {
  constructor(readonly repo: RegistrarEventoContratoRepository) {}

  async execute(input: RegistrarEventoContratoInput): Promise<RegistrarEventoContratoOutput> {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const contratoUuid = garantirUuid(input.contratoUuid, MSG_CONTRATO_NAO_ENCONTRADO);
    if (!CONTRATO_EVENTO_TIPOS.includes(input.tipo)) throw new ApiError("Tipo de evento inválido");
    const tipo = input.tipo;
    const data = validarData(input.data, "Data do evento inválida");
    const descricao = textoOpcional(input.descricao);
    if (!descricao) throw new ApiError("A descrição do evento é obrigatória");

    const encerra = tipo === "encerramento" || tipo === "rescisao";
    const valorNovo = encerra || vazio(input.valorNovo) ? null : validarValorAluguel(input.valorNovo);
    const fimNovo = encerra || vazio(input.fimNovo) ? null : validarData(input.fimNovo, "Data de fim inválida");
    const userUuid = vazio(input.userUuid) ? null : garantirUuid(input.userUuid, "Usuário não encontrado");

    const decidir = (atual: ContratoAtual): EventoDecidido => {
      if (tipo === "renovacao" && !(fimNovo && fimNovo > atual.fim)) throw new ApiError("A renovação deve estender a data de fim");
      if (tipo === "aditivo") {
        if (valorNovo === null && fimNovo === null) throw new ApiError("Informe o novo valor ou a nova data de fim");
        if (fimNovo !== null) validarFimPosteriorInicio(atual.inicio, fimNovo);
      }
      return {
        tipo,
        data,
        descricao,
        valorAnterior: valorNovo === null ? null : atual.valorAluguel,
        valorNovo,
        fimAnterior: fimNovo === null ? null : atual.fim,
        fimNovo,
        statusNovo: tipo === "encerramento" ? "encerrado" : tipo === "rescisao" ? "rescindido" : null,
      };
    };

    const uuid = await this.repo.registrar(input.companyUuid, userUuid, contratoUuid, decidir);
    return { uuid };
  }
}
