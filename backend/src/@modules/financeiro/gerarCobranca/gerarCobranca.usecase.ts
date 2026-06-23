import { randomUUID } from "crypto";
import { CobrancaEntity } from "./cobranca.entity";
import { GerarCobrancaRepository } from "./gerarCobrancaRepository";
import { ApiError } from "src/@modules/shared/apiError";

export type GerarCobrancaInput = {
  companyUuid: string;
  userUuid: string;
  origem: string;
  origemUuid: string;
  tipoCobranca?: string;
  cartaoUuid?: string;
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
    const usuario = await this.repo.buscarUsuario(input.userUuid);
    if (!usuario) throw new Error("Usuário não encontrado.");
    let cartao;
    if (input.tipoCobranca === "cartaoCredito") {
      cartao = usuario.buscarCartao(input?.cartaoUuid as string);
      if (!cartao) throw new ApiError("Cartão não encontrado");
    }

    const gateway = this.repo.buscarGateway();
    const cobranca = new CobrancaEntity({
      uuid: randomUUID(),
      companyUuid: input.companyUuid,
      userUuid: input.userUuid,
      tipoCobranca: input.tipoCobranca,
      pagadorNome: input.pagadorNome,
      pagadorDocumento: input.pagadorDocumento,
      pagadorEmail: input.pagadorEmail,
      pagadorTelefone: input.pagadorTelefone,
      origem: input.origem,
      origemUuid: input.origemUuid,
      valor: input.valor,
      vencimento: input.vencimento,
      numParcelas: input.numParcelas ?? 1,
      cartaoCredito: {
        cartaoUuid: input.cartaoUuid,
        token: cartao?.token,
      },
    });
    const result = await gateway.gerarCobranca(cobranca);
    cobranca.setBancoRef(result.gatewayRef);
    await this.repo.savarCobranca(cobranca);
    await this.repo.savarPagamentos(cobranca, result.pagamentos);
  }
}
