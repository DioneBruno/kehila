export type PessoaTipo = "PF" | "PJ";

export type PessoaPapel = "proprietario" | "inquilino" | "fiador";

export const PAPEIS_PESSOA: PessoaPapel[] = ["proprietario", "inquilino", "fiador"];

export type ImovelTipo = "casa" | "apartamento" | "sala_comercial" | "loja" | "galpao" | "terreno" | "outro";
export const IMOVEL_TIPOS: ImovelTipo[] = ["casa", "apartamento", "sala_comercial", "loja", "galpao", "terreno", "outro"];

export type ImovelFinalidade = "residencial" | "comercial";
export const IMOVEL_FINALIDADES: ImovelFinalidade[] = ["residencial", "comercial"];

export type ImovelSituacao = "livre" | "alugado" | "reforma" | "inativo";
export const IMOVEL_SITUACOES: ImovelSituacao[] = ["livre", "alugado", "reforma", "inativo"];
