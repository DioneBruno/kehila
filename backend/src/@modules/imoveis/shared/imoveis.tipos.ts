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

export type ContaTipo = "encargo" | "despesa" | "guia";
export const CONTA_TIPOS: ContaTipo[] = ["encargo", "despesa", "guia"];

export type ContaEsfera = "municipal" | "estadual" | "federal";
export const CONTA_ESFERAS: ContaEsfera[] = ["municipal", "estadual", "federal"];

export type ContaResponsavel = "proprietario" | "inquilino";
export const CONTA_RESPONSAVEIS: ContaResponsavel[] = ["proprietario", "inquilino"];

export type ContaSituacao = "a_pagar" | "vencida" | "paga";
export const CONTA_SITUACOES: ContaSituacao[] = ["a_pagar", "vencida", "paga"];

export type AnexoTipo = "documento" | "comprovante";
export const ANEXO_TIPOS: AnexoTipo[] = ["documento", "comprovante"];

export const CATEGORIAS_POR_TIPO: Record<ContaTipo, string[]> = {
  encargo: ["iptu", "taxa_lixo", "taxa_municipal", "condominio", "agua", "energia", "gas", "seguro", "outros"],
  despesa: ["manutencao", "conservacao", "reforma", "limpeza", "servico", "outros"],
  guia: ["carne_leao", "darf", "das", "gps", "iss", "itbi", "itcmd", "outros"],
};
