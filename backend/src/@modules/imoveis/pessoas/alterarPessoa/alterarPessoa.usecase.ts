import { ApiError } from "src/@modules/shared/apiError";
import { EnderecoInput, normalizarEmailPessoa, normalizarUf, textoOpcional, validarDocumentoPessoa } from "../pessoa.entity";
import { garantirUuid } from "../../shared/garantirUuid";
import { AlterarPessoaColunas, AlterarPessoaRepository } from "./alterarPessoaRepository";

/** Campos ausentes (undefined) não mudam; null limpa o campo. O tipo (PF/PJ) não pode ser alterado. */
export type AlterarPessoaInput = {
  companyUuid: string;
  uuid: string;
  documento?: string;
  nome?: string;
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

const papel = (valor: unknown): boolean | undefined => {
  if (valor === undefined) return undefined;
  if (typeof valor === "boolean") return valor;
  throw new ApiError("Valor inválido para papel", 400);
};

const opcional = (valor: string | null | undefined) => (valor === undefined ? undefined : textoOpcional(valor));

export class AlterarPessoaUsecase {
  constructor(readonly repo: AlterarPessoaRepository) {}

  async execute(input: AlterarPessoaInput): Promise<void> {
    const { companyUuid } = input;
    if (!companyUuid) throw new ApiError("Empresa não identificada", 401);
    const uuid = garantirUuid(input.uuid, "Pessoa não encontrada");

    const tipo = await this.repo.buscarTipo(companyUuid, uuid);
    if (!tipo) throw new ApiError("Pessoa não encontrada", 404);

    const nome = opcional(input.nome);
    if (nome === null) throw new ApiError("O nome é obrigatório");

    const e = input.endereco ?? {};
    const colunas: AlterarPessoaColunas = {
      documento: input.documento === undefined ? undefined : validarDocumentoPessoa(tipo, input.documento),
      nome,
      nome_fantasia: opcional(input.nomeFantasia),
      rg_ie: opcional(input.rgIe),
      email: input.email === undefined ? undefined : normalizarEmailPessoa(input.email),
      telefone: opcional(input.telefone),
      endereco_cep: opcional(e.cep),
      endereco_logradouro: opcional(e.logradouro),
      endereco_numero: opcional(e.numero),
      endereco_complemento: opcional(e.complemento),
      endereco_bairro: opcional(e.bairro),
      endereco_cidade: opcional(e.cidade),
      endereco_uf: e.uf === undefined ? undefined : normalizarUf(e.uf),
      observacoes: opcional(input.observacoes),
      eh_proprietario: papel(input.ehProprietario),
      eh_inquilino: papel(input.ehInquilino),
      eh_fiador: papel(input.ehFiador),
    };

    await this.repo.alterar(companyUuid, uuid, colunas);
  }
}
