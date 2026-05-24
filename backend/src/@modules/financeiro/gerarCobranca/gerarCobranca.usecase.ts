import { randomUUID } from "crypto";
import { CobrancaEntity } from "./cobranca.entity";
import { GerarCobrancaRepository } from "./gerarCobrancaRepository";

export type GerarCobrancaInput = {
  companyUuid: string;
  userUuid: string;
  origem: string;
  origemUuid: string;
  pagadorNome: string;
  pagadorDocumento: string;
  pagadorEmail: string;
  pagadorTelefone: string;
  valor: number;
};
export class GerarCobrancaUsecase {
  constructor(readonly repo: GerarCobrancaRepository) {}

  async execute(input: GerarCobrancaInput) {
    const cobranca = new CobrancaEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      userUuid: input.userUuid,
      pagadorNome: input.pagadorNome,
      pagadorDocumento: input.pagadorDocumento,
      pagadorEmail: input.pagadorEmail,
      pagadorTelefone: input.pagadorTelefone,
      origem: input.origem,
      origemUuid: input.origemUuid,
      valor: input.valor,
    });
    await this.repo.savarCobranca(cobranca);
  }
}
