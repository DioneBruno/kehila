import { ContratoEntity, CriarContratoProps } from "../contrato.entity";
import { IncluirContratoRepository } from "./incluirContratoRepository";

export type IncluirContratoInput = CriarContratoProps;

export type IncluirContratoOutput = {
  uuid: string;
};

export class IncluirContratoUsecase {
  constructor(readonly repo: IncluirContratoRepository) {}

  async execute(input: IncluirContratoInput): Promise<IncluirContratoOutput> {
    const contrato = ContratoEntity.criar(input);
    await this.repo.incluir(contrato);
    return { uuid: contrato.uuid };
  }
}
