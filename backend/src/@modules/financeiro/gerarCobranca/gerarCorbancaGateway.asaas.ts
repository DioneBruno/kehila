import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";
import { ApiDate } from "src/@modules/shared/apiDate";
import { ApiError } from "src/@modules/shared/apiError";

export type PagamentoOutput = {
  gatewayRef: string; // id
  nossoNumero: string; // nossoNumero
  urlBoleto: string; // bankSlipUrl
  vancimento: string; // dueDate
  linkBoleto: string; // bankSlipUrl
  codigoBarras: string; // codigoBarras
  linhaDigitavel: string; // linhaDigitavel
  pix: string; // pix
  linkCartao: string;
  valorCobranca: number; // value
  valorComDescontoGateway: number; // netValue
  status: string;
};

export type GerarCobrancaOutput = {
  gatewayRef: string; // installment
  pagamentos: PagamentoOutput[];
};

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export class GerarCobrancaGatewayAsaas {
  constructor(readonly connectionHub: ConnectionHub) {}

  async gerarCobranca(cobranca: CobrancaEntity): Promise<GerarCobrancaOutput> {
    try {
      switch (cobranca.tipoCobranca()) {
        case "boleto":
          return await this.formaPagamentoBoleto(cobranca);
        // case "pix":
        //   return await this.formaPagamentoPix(cobranca);
        case "cartaoCredito":
          return await this.formaPagamentoCartaoCredito(cobranca);
        default:
          throw new Error("Tipo de cobrança inválido");
      }
    } catch (error: any) {
      console.log(error.response?.data);
      throw error;
    }
  }

  private async formaPagamentoBoleto(cobranca: CobrancaEntity): Promise<GerarCobrancaOutput> {
    const cliente = await this.buscarCliente(cobranca);
    const { token, baseUrl } = await this.buscarToken(cobranca);

    const url = `${baseUrl}/v3/payments`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const body = {
      externalReference: cobranca.uuid(),
      billingType: this.tipoCobranca(cobranca), //BOLETO, CREDIT_CARD, PIX
      customer: cliente.id,
      value: cobranca.valor(),
      dueDate: ApiDate.format(ApiDate.addDay(ApiDate.now(), 1), "YYYY-MM-DD"),
      description: `Breve descrição para a cobrança`,
      installmentCount: cobranca.totalParcelas(), // Número de parcelas (somente no caso de cobrança parcelada)
      // installmentValue: cobranca.valor(), // Valor de cada parcela (somente no caso de cobrança parcelada). Envie este campo em caso de querer definir o valor de cada parcela.
      totalValue: cobranca.valor(), // Informe o valor total de uma cobrança que será parcelada (somente no caso de cobrança parcelada). Caso enviado este campo o installmentValue não é necessário, o cálculo por parcela será automático.
      // daysAfterDueDateToRegistrationCancellation: 1, // Dias após o vencimento para cancelamento do registro (somente para boleto bancário)
      // fine: { type: "PERCENTAGE", value: 2 }, // Informações de multa para pagamento após o vencimento
      // callback: { successUrl: "", autoRedirect: true }, // Informações de redirecionamento automático após pagamento do link de pagamento
    };
    const responseCobranca = await this.connectionHub.http?.post(url, body, { headers });
    const responseParcelas = await this.buscarParcelas(cobranca, responseCobranca?.data?.installment);
    return {
      gatewayRef: responseCobranca?.data?.installment,
      pagamentos: responseParcelas,
    };
  }

  private async formaPagamentoCartaoCredito(cobranca: CobrancaEntity): Promise<GerarCobrancaOutput> {
    const cliente = await this.buscarCliente(cobranca);

    const { token, baseUrl } = await this.buscarToken(cobranca);
    const url = `${baseUrl}/v3/payments`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const body = {
      externalReference: cobranca.uuid(),
      billingType: this.tipoCobranca(cobranca), //BOLETO, CREDIT_CARD, PIX
      customer: cliente.id,
      value: cobranca.valor(),
      dueDate: ApiDate.format(ApiDate.addDay(ApiDate.now(), 1), "YYYY-MM-DD"),
      description: `Breve descrição para a cobrança`,
      installmentCount: cobranca.totalParcelas(), // Número de parcelas (somente no caso de cobrança parcelada)
      // installmentValue: cobranca.valor(), // Valor de cada parcela (somente no caso de cobrança parcelada). Envie este campo em caso de querer definir o valor de cada parcela.
      totalValue: cobranca.valor(), // Informe o valor total de uma cobrança que será parcelada (somente no caso de cobrança parcelada). Caso enviado este campo o installmentValue não é necessário, o cálculo por parcela será automático.
      // daysAfterDueDateToRegistrationCancellation: 1, // Dias após o vencimento para cancelamento do registro (somente para boleto bancário)
      // fine: { type: "PERCENTAGE", value: 2 }, // Informações de multa para pagamento após o vencimento
      // callback: { successUrl: "", autoRedirect: true }, // Informações de redirecionamento automático após pagamento do link de pagamento
      creditCard: {
        holderName: cobranca.cartaoCredito()?.nomeNoCartao,
        number: cobranca.cartaoCredito()?.numeroCartao,
        expiryMonth: cobranca.cartaoCredito()?.mesVencimento,
        expiryYear: cobranca.cartaoCredito()?.anoVencimento,
        ccv: cobranca.cartaoCredito()?.codigoSeguranca,
      },
    };
    const responseCobranca = await this.connectionHub.http?.post(url, body, { headers });
    const pagamentos = await this.buscarParcelas(cobranca, responseCobranca?.data?.installment);
    return {
      gatewayRef: responseCobranca?.data?.installment,
      pagamentos,
    };
  }

  private tipoCobranca(cobranca: CobrancaEntity) {
    switch (cobranca.tipoCobranca()) {
      case "cartaoCredito":
        return "CREDIT_CARD";
      case "boleto":
        return "BOLETO";
      case "pix":
        return "PIX";
      default:
        return "BOLETO";
    }
  }

  private async buscarCliente(cobranca: CobrancaEntity): Promise<{ id: string }> {
    const { token, baseUrl } = await this.buscarToken(cobranca);
    const url = `${baseUrl}/v3/customers?cpfCnpj=${cobranca.pagador().documento}`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const response = await this.connectionHub.http?.get(url, { headers });
    if (!response?.data?.data.length) return await this.cadastrarCliente(cobranca);
    return response?.data?.data[0];
  }

  private async cadastrarCliente(cobranca: CobrancaEntity) {
    const { token, baseUrl } = await this.buscarToken(cobranca);
    const url = `${baseUrl}/v3/customers`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const body = {
      name: cobranca.pagador().nome,
      cpfCnpj: cobranca.pagador().documento,
      email: cobranca.pagador().email,
      phone: cobranca.pagador().telefone,
    };
    await this.connectionHub.http?.post(url, body, { headers });
    return this.buscarCliente(cobranca);
  }

  private async buscarParcelas(cobranca: CobrancaEntity, installment: string, linkCartao?: string): Promise<PagamentoOutput[]> {
    try {
      const { token, baseUrl } = await this.buscarToken(cobranca);
      const url = `${baseUrl}/v3/installments/${installment}/payments?limit=24`;
      const headers = {
        accept: "application/json",
        "User-Agent": "NomeDaSuaAplicacao/1.0.0",
        "content-type": "application/json",
        access_token: token,
      };
      const response = await this.connectionHub.http?.get(url, { headers });

      return response?.data?.data?.map((installment: any) => {
        return {
          gatewayRef: installment.id,
          nossoNumero: installment.nossoNumero,
          urlBoleto: installment.bankSlipUrl,
          vancimento: installment.dueDate,
          linkBoleto: installment.bankSlipUrl,
          linkCartao: installment.invoiceUrl,
          codigoBarras: null,
          linhaDigitavel: null,
          pix: installment.pixTransaction?.qrCode?.payload,
          valorCobranca: installment.value,
          valorComDescontoGateway: installment.netValue,
          status: installment.status,
        };
      }) as PagamentoOutput[];
    } catch (error: any) {
      console.log(error);
      return [];
    }
  }

  private async buscarToken(cobranca: CobrancaEntity): Promise<{ token: string; baseUrl: string }> {
    const [contaBancariaModel] = await this.connectionHub.database?.query(
      `SELECT chave_api, ambiente FROM financeiro_contas_bancarias WHERE deleted_at IS NULL AND company_uuid = $1 AND status = 'ativo'`,
      [cobranca.companyUuid()],
    );
    if (!contaBancariaModel) throw new ApiError("Conta bancária não encontrada", 400);
    const baseUrl = contaBancariaModel.ambiente === "PROD" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
    return { token: contaBancariaModel.chave_api, baseUrl };
  }
}
