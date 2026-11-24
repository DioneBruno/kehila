import { randomUUID } from "crypto";
import { ApiError } from "src/@modules/shared/apiError";
import { ApiValidate } from "src/@modules/shared/apiValidate";
import { PessoaTipo } from "../shared/imoveis.tipos";

export type EnderecoInput = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
};

export type PessoaProps = {
  uuid: string;
  companyUuid: string;
  tipo: PessoaTipo;
  documento: string;
  nome: string;
  nomeFantasia: string | null;
  rgIe: string | null;
  email: string | null;
  telefone: string | null;
  endereco: Required<EnderecoInput>;
  observacoes: string | null;
  ehProprietario: boolean;
  ehInquilino: boolean;
  ehFiador: boolean;
};

export type CriarPessoaProps = {
  companyUuid: string;
  tipo: PessoaTipo;
  documento: string;
  nome: string;
  nomeFantasia?: string | null;
  rgIe?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: EnderecoInput;
  observacoes?: string | null;
  ehProprietario?: boolean;
  ehInquilino?: boolean;
  ehFiador?: boolean;
};

export const textoOpcional = (valor: string | null | undefined): string | null => (typeof valor === "string" ? valor.trim() || null : null);

export function normalizarDocumento(documento: string | null | undefined): string {
  return String(documento ?? "").replace(/\D/g, "");
}

/** Normaliza (só dígitos) e valida o documento conforme o tipo. */
export function validarDocumentoPessoa(tipo: PessoaTipo, documento: string | null | undefined): string {
  if (tipo !== "PF" && tipo !== "PJ") throw new ApiError("Tipo de pessoa inválido. Use PF ou PJ");
  const digitos = normalizarDocumento(documento);
  if (tipo === "PF" && !ApiValidate.validateCpf(digitos)) throw new ApiError("CPF inválido");
  if (tipo === "PJ" && !ApiValidate.validateCnpj(digitos)) throw new ApiError("CNPJ inválido");
  return digitos;
}

export function normalizarEmailPessoa(email: string | null | undefined): string | null {
  const texto = textoOpcional(email);
  if (texto && !ApiValidate.validateEmail(texto)) throw new ApiError("E-mail inválido");
  return texto;
}

export function normalizarUf(uf: string | null | undefined): string | null {
  const texto = textoOpcional(uf)?.toUpperCase() ?? null;
  if (texto && !/^[A-Z]{2}$/.test(texto)) throw new ApiError("UF inválida. Use 2 letras");
  return texto;
}

export class PessoaEntity {
  constructor(readonly props: PessoaProps) {}

  static criar(input: CriarPessoaProps): PessoaEntity {
    if (!input.companyUuid) throw new ApiError("Empresa não identificada", 401);
    const documento = validarDocumentoPessoa(input.tipo, input.documento);
    const nome = textoOpcional(input.nome);
    if (!nome) throw new ApiError("O nome é obrigatório");
    const e = input.endereco ?? {};

    return new PessoaEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      tipo: input.tipo,
      documento,
      nome,
      nomeFantasia: textoOpcional(input.nomeFantasia),
      rgIe: textoOpcional(input.rgIe),
      email: normalizarEmailPessoa(input.email),
      telefone: textoOpcional(input.telefone),
      endereco: {
        cep: textoOpcional(e.cep),
        logradouro: textoOpcional(e.logradouro),
        numero: textoOpcional(e.numero),
        complemento: textoOpcional(e.complemento),
        bairro: textoOpcional(e.bairro),
        cidade: textoOpcional(e.cidade),
        uf: normalizarUf(e.uf),
      },
      observacoes: textoOpcional(input.observacoes),
      ehProprietario: input.ehProprietario === true,
      ehInquilino: input.ehInquilino === true,
      ehFiador: input.ehFiador === true,
    });
  }

  get uuid() {
    return this.props.uuid;
  }
}
