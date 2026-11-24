import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { EnderecoInput, normalizarUf, textoOpcional } from "../pessoas/pessoa.entity";
import { garantirUuid } from "../shared/garantirUuid";
import { IMOVEL_FINALIDADES, IMOVEL_SITUACOES, IMOVEL_TIPOS, ImovelFinalidade, ImovelSituacao, ImovelTipo } from "../shared/imoveis.tipos";

export type ImovelProps = {
  uuid: string;
  companyUuid: string;
  proprietarioUuid: string;
  identificacao: string;
  tipo: ImovelTipo;
  finalidade: ImovelFinalidade;
  endereco: Required<EnderecoInput>;
  inscricaoIptu: string | null;
  matricula: string | null;
  cartorio: string | null;
  areaM2: number | null;
  observacoes: string | null;
};

export type CriarImovelProps = {
  companyUuid: string;
  proprietarioUuid: string;
  identificacao: string;
  tipo: ImovelTipo;
  finalidade: ImovelFinalidade;
  endereco?: EnderecoInput;
  inscricaoIptu?: string | null;
  matricula?: string | null;
  cartorio?: string | null;
  areaM2?: number | null;
  observacoes?: string | null;
};

export const MSG_PROPRIETARIO_NAO_ENCONTRADO = "Proprietário não encontrado";

export function validarProprietarioUuid(valor: unknown): string {
  return garantirUuid(valor, MSG_PROPRIETARIO_NAO_ENCONTRADO);
}

export function validarIdentificacao(valor: string | null | undefined): string {
  const texto = textoOpcional(valor);
  if (!texto) throw new ApiError("A identificação do imóvel é obrigatória");
  return texto;
}

export function validarTipoImovel(valor: unknown): ImovelTipo {
  if (!IMOVEL_TIPOS.includes(valor as ImovelTipo)) throw new ApiError("Tipo de imóvel inválido");
  return valor as ImovelTipo;
}

export function validarFinalidade(valor: unknown): ImovelFinalidade {
  if (!IMOVEL_FINALIDADES.includes(valor as ImovelFinalidade)) throw new ApiError("Finalidade inválida. Use residencial ou comercial");
  return valor as ImovelFinalidade;
}

export function validarSituacao(valor: unknown): ImovelSituacao {
  if (!IMOVEL_SITUACOES.includes(valor as ImovelSituacao)) throw new ApiError("Situação inválida");
  return valor as ImovelSituacao;
}

export function validarArea(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0 || numero >= 1e10) throw new ApiError("Área inválida");
  return Math.round(numero * 100) / 100;
}

export class ImovelEntity {
  constructor(readonly props: ImovelProps) {}

  static criar(input: CriarImovelProps): ImovelEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const proprietarioUuid = validarProprietarioUuid(input.proprietarioUuid);
    const identificacao = validarIdentificacao(input.identificacao);
    const tipo = validarTipoImovel(input.tipo);
    const finalidade = validarFinalidade(input.finalidade);
    const e = input.endereco ?? {};

    return new ImovelEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      proprietarioUuid,
      identificacao,
      tipo,
      finalidade,
      endereco: {
        cep: textoOpcional(e.cep),
        logradouro: textoOpcional(e.logradouro),
        numero: textoOpcional(e.numero),
        complemento: textoOpcional(e.complemento),
        bairro: textoOpcional(e.bairro),
        cidade: textoOpcional(e.cidade),
        uf: normalizarUf(e.uf),
      },
      inscricaoIptu: textoOpcional(input.inscricaoIptu),
      matricula: textoOpcional(input.matricula),
      cartorio: textoOpcional(input.cartorio),
      areaM2: validarArea(input.areaM2),
      observacoes: textoOpcional(input.observacoes),
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}
