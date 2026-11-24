import { ApiError } from "src/@modules/shared/apiError";
import { EnderecoInput, normalizarUf, textoOpcional } from "../../pessoas/pessoa.entity";
import { garantirUuid } from "../../shared/garantirUuid";
import { ImovelFinalidade, ImovelSituacao, ImovelTipo } from "../../shared/imoveis.tipos";
import { validarArea, validarFinalidade, validarIdentificacao, validarProprietarioUuid, validarSituacao, validarTipoImovel } from "../imovel.entity";
import { AlterarImovelColunas, AlterarImovelRepository, EstadoImovel } from "./alterarImovelRepository";

/** Campos ausentes (undefined) não mudam; null limpa os campos opcionais. */
export type AlterarImovelInput = {
  companyUuid: string;
  uuid: string;
  proprietarioUuid?: string;
  identificacao?: string;
  tipo?: ImovelTipo;
  finalidade?: ImovelFinalidade;
  endereco?: EnderecoInput;
  inscricaoIptu?: string | null;
  matricula?: string | null;
  cartorio?: string | null;
  areaM2?: number | null;
  situacao?: ImovelSituacao;
  observacoes?: string | null;
};

const opcional = (valor: string | null | undefined) => (valor === undefined ? undefined : textoOpcional(valor));

export class AlterarImovelUsecase {
  constructor(readonly repo: AlterarImovelRepository) {}

  async execute(input: AlterarImovelInput): Promise<void> {
    const { companyUuid } = input;
    if (!companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, "Imóvel não encontrado");

    const situacaoInformada: ImovelSituacao | undefined = input.situacao === undefined ? undefined : validarSituacao(input.situacao);

    const e = input.endereco ?? {};
    const colunas: AlterarImovelColunas = {
      proprietario_uuid: input.proprietarioUuid === undefined ? undefined : validarProprietarioUuid(input.proprietarioUuid),
      identificacao: input.identificacao === undefined ? undefined : validarIdentificacao(input.identificacao),
      tipo: input.tipo === undefined ? undefined : validarTipoImovel(input.tipo),
      finalidade: input.finalidade === undefined ? undefined : validarFinalidade(input.finalidade),
      endereco_cep: opcional(e.cep),
      endereco_logradouro: opcional(e.logradouro),
      endereco_numero: opcional(e.numero),
      endereco_complemento: opcional(e.complemento),
      endereco_bairro: opcional(e.bairro),
      endereco_cidade: opcional(e.cidade),
      endereco_uf: e.uf === undefined ? undefined : normalizarUf(e.uf),
      inscricao_iptu: opcional(input.inscricaoIptu),
      matricula: opcional(input.matricula),
      cartorio: opcional(input.cartorio),
      area_m2: input.areaM2 === undefined ? undefined : validarArea(input.areaM2),
      observacoes: opcional(input.observacoes),
    };

    // A decisão sobre a situação roda com o imóvel travado (ver repositório), para não correr com IncluirContrato.
    const montar = async ({ situacao: situacaoAtual, temContratoVigente }: EstadoImovel): Promise<AlterarImovelColunas> => {
      if (situacaoInformada === undefined || situacaoInformada === situacaoAtual) return colunas;
      if (situacaoInformada === "alugado") throw new ApiError("A situação 'alugado' é definida pelo contrato");
      if (await temContratoVigente()) throw new ApiError("Imóvel com contrato vigente não pode mudar de situação", 409);
      return { ...colunas, situacao: situacaoInformada };
    };

    await this.repo.alterar(companyUuid, uuid, montar);
  }
}
