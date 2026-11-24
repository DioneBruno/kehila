import { CriarImovelProps, ImovelEntity } from "../imovel.entity";
import { IncluirImovelRepository } from "./incluirImovelRepository";

export type IncluirImovelInput = CriarImovelProps;

export type IncluirImovelOutput = {
  uuid: string;
};

export class IncluirImovelUsecase {
  constructor(readonly repo: IncluirImovelRepository) {}

  async execute(input: IncluirImovelInput): Promise<IncluirImovelOutput> {
    const imovel = ImovelEntity.criar(input);
    await this.repo.incluir(imovel);
    return { uuid: imovel.uuid };
  }
}
