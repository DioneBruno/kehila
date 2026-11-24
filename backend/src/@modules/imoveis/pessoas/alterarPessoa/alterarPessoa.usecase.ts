import { ApiError } from "src/@modules/shared/apiError";
import { EnderecoInput, normalizarEmailPessoa, normalizarUf, textoOpcional, validarDocumentoPessoa } from "../pessoa.entity";
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

const opcional = (valor: string | null | undefined) => (valor === undefined ? undefined : textoOpcional(valor));

export class AlterarPessoaUsecase {
  constructor(readonly repo: AlterarPessoaRepository) {}

  async execute(input: AlterarPessoaInput): Promise<void> {
    const { companyUuid, uuid } = input;
    if (!companyUuid) throw new ApiError("Empresa não identificada", 401);
    if (!uuid) throw new ApiError("Pessoa não identificada");

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
      eh_proprietario: input.ehProprietario,
      eh_inquilino: input.ehInquilino,
      eh_fiador: input.ehFiador,
    };

    await this.repo.alterar(companyUuid, uuid, colunas);
  }
}
