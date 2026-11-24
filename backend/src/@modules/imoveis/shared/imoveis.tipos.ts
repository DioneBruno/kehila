export type PessoaTipo = "PF" | "PJ";

export type PessoaPapel = "proprietario" | "inquilino" | "fiador";

export const PAPEIS_PESSOA: PessoaPapel[] = ["proprietario", "inquilino", "fiador"];

export type ImovelTipo = "casa" | "apartamento" | "sala_comercial" | "loja" | "galpao" | "terreno" | "outro";
export const IMOVEL_TIPOS: ImovelTipo[] = ["casa", "apartamento", "sala_comercial", "loja", "galpao", "terreno", "outro"];

export type ImovelFinalidade = "residencial" | "comercial";
export const IMOVEL_FINALIDADES: ImovelFinalidade[] = ["residencial", "comercial"];

export type ImovelSituacao = "livre" | "alugado" | "reforma" | "inativo";
export const IMOVEL_SITUACOES: ImovelSituacao[] = ["livre", "alugado", "reforma", "inativo"];

export type IndiceReajuste = "IGPM" | "IPCA" | "INPC" | "IGPDI" | "nenhum";
export const INDICES_REAJUSTE: IndiceReajuste[] = ["IGPM", "IPCA", "INPC", "IGPDI", "nenhum"];

export type GarantiaTipo = "fiador" | "caucao" | "seguro_fianca" | "titulo_capitalizacao" | "nenhuma";
export const GARANTIA_TIPOS: GarantiaTipo[] = ["fiador", "caucao", "seguro_fianca", "titulo_capitalizacao", "nenhuma"];

export type ContratoStatus = "vigente" | "encerrado" | "rescindido";
export const CONTRATO_STATUS: ContratoStatus[] = ["vigente", "encerrado", "rescindido"];

export type ContratoEventoTipo = "renovacao" | "aditivo" | "encerramento" | "rescisao";
export const CONTRATO_EVENTO_TIPOS: ContratoEventoTipo[] = ["renovacao", "aditivo", "encerramento", "rescisao"];
