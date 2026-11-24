import { PessoaTipo } from "../../shared/imoveis.tipos";
import { CriarPessoaProps, PessoaEntity } from "../pessoa.entity";
import { IncluirPessoaRepository } from "./incluirPessoaRepository";

export type IncluirPessoaInput = CriarPessoaProps & { tipo: PessoaTipo };

export type IncluirPessoaOutput = {
  uuid: string;
};

export class IncluirPessoaUsecase {
  constructor(readonly repo: IncluirPessoaRepository) {}

  async execute(input: IncluirPessoaInput): Promise<IncluirPessoaOutput> {
    const pessoa = PessoaEntity.criar(input);
    await this.repo.incluir(pessoa);
    return { uuid: pessoa.uuid };
  }
}
