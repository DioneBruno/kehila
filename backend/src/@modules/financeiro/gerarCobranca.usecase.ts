import { GerarCobrancaRepository } from "./gerarCobrancaRepository";

export type GerarCobrancaInput = {
  companyUuid: string;
};
export class GerarCobrancaUsecase {
  constructor(readonly repo: GerarCobrancaRepository) {}

  async execute(input: GerarCobrancaInput) {}
}
