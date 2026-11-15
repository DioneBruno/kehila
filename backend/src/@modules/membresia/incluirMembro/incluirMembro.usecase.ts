import { IncluirMembroRepository } from "./incluirMembroRepository";
import { MembroEntity } from "./membro.entity";

export type IncluirMembroInput = {
  companyUuid: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  estadoCivil?: string;
  dataNascimento?: string;
  enderecoCep?: string;
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUf?: string;
  ativo?: boolean;
  membro?: boolean;
  batizado?: boolean;
  transferido?: boolean;
  meta?: Record<string, any>;
};

export type IncluirMembroOutput = {
  uuid: string;
};

export class IncluirMembroUsecase {
  constructor(readonly repo: IncluirMembroRepository) {}

  async execute(input: IncluirMembroInput): Promise<IncluirMembroOutput> {
    const membro = MembroEntity.criar(input);
    await this.repo.incluir(membro);
    return { uuid: membro.uuid };
  }
}
