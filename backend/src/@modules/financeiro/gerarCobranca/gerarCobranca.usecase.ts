import { randomUUID } from "crypto";
import { CobrancaEntity } from "./cobranca.entity";
import { GerarCobrancaRepository } from "./gerarCobrancaRepository";

export type GerarCobrancaInput = {
  companyUuid: string;
  userUuid: string;
  origem: string;
  origemUuid: string;
  tipoCobranca?: string;
  cartaoCredito?: {
    nomeNoCartao: string;
    numeroCartao: string;
    mesVencimento: string;
    anoVencimento: string;
    codigoSeguranca: string;
  };
  pagadorNome: string;
  pagadorDocumento: string;
  pagadorEmail: string;
  pagadorTelefone: string;
  valor: number;
  vencimento?: string;
  numParcelas?: number;
};
export class GerarCobrancaUsecase {
  constructor(readonly repo: GerarCobrancaRepository) {}

  async execute(input: GerarCobrancaInput): Promise<any> {
    const gateway = this.repo.buscarGateway();
    const cobranca = new CobrancaEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      userUuid: input.userUuid,
      tipoCobranca: input.tipoCobranca,
      cartaoCredito: input.cartaoCredito,
      pagadorNome: input.pagadorNome,
      pagadorDocumento: input.pagadorDocumento,
      pagadorEmail: input.pagadorEmail,
      pagadorTelefone: input.pagadorTelefone,
      origem: input.origem,
      origemUuid: input.origemUuid,
      valor: input.valor,
      vencimento: input.vencimento,
      numParcelas: input.numParcelas ?? 1,
    });
    const result = await gateway.gerarCobranca(cobranca);
    cobranca.setBancoRef(result.gatewayRef);
    await this.repo.savarCobranca(cobranca);
    await this.repo.savarPagamentos(cobranca, result.pagamentos);
  }
}
