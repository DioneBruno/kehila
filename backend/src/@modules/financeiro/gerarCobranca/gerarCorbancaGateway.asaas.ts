import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";

export type GerarCobrancaOutput = {
  gatewayRef: string; // installment
  pagamentos: {
    gatewayRef: string; // id
    nossoNumero: string; // nossoNumero
    urlBoleto: string; // bankSlipUrl
    vancimento: string; // dueDate
    linkBoleto: string; // bankSlipUrl
    codigoBarras: string; // codigoBarras
    linhaDigitavel: string; // linhaDigitavel
    pix: string; // pix
    valorCobranca: number; // value
    valorComDescontoGateway: number; // netValue
  }[];
};

export class GerarCobrancaGatewayAsaas {
  constructor(readonly connectionHub: ConnectionHub) {}

  async gerarCobranca(cobranca: CobrancaEntity): Promise<GerarCobrancaOutput> {
    try {
      const cliente = await this.buscarCliente(cobranca.pagador());

      const url = "https://api-sandbox.asaas.com/v3/payments";
      const headers = {
        accept: "application/json",
        "User-Agent": "NomeDaSuaAplicacao/1.0.0",
        "content-type": "application/json",
        access_token: process.env.FINANCEIRO_CHAVE_API,
      };
      const body = {
        externalReference: cobranca.uuid(),
        billingType: "boleto", //BOLETO, CREDIT_CARD, PIX
        customer: cliente.id,
        value: cobranca.valor(),
        dueDate: "2026-06-10",
        description: `Breve descrição para a cobrança`,
        installmentCount: cobranca.totalParcelas(), // Número de parcelas (somente no caso de cobrança parcelada)
        // installmentValue: cobranca.valor(), // Valor de cada parcela (somente no caso de cobrança parcelada). Envie este campo em caso de querer definir o valor de cada parcela.
        totalValue: cobranca.valor(), // Informe o valor total de uma cobrança que será parcelada (somente no caso de cobrança parcelada). Caso enviado este campo o installmentValue não é necessário, o cálculo por parcela será automático.
        // daysAfterDueDateToRegistrationCancellation: 1, // Dias após o vencimento para cancelamento do registro (somente para boleto bancário)
        // fine: { type: "PERCENTAGE", value: 2 }, // Informações de multa para pagamento após o vencimento
        // callback: { successUrl: "", autoRedirect: true }, // Informações de redirecionamento automático após pagamento do link de pagamento
      };
      const responseCobranca = await this.connectionHub.http?.post(url, body, { headers });
      const responseParcelas = await this.buscarParcelas(responseCobranca?.data?.installment);
      return {
        gatewayRef: responseCobranca?.data?.installment,
        pagamentos: responseParcelas,
      };
    } catch (error: any) {
      console.log(error.response?.data);
      throw error;
    }
  }

  private async buscarCliente(pagador: { nome: string; documento: string; email: string; telefone: string }): Promise<{ id: string }> {
    const url = `https://api-sandbox.asaas.com/v3/customers?cpfCnpj=${pagador.documento}`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: process.env.FINANCEIRO_CHAVE_API,
    };
    const response = await this.connectionHub.http?.get(url, { headers });
    if (!response?.data?.data.length) return await this.cadastrarCliente(pagador);
    return response?.data?.data[0];
  }

  private async cadastrarCliente(pagador: { nome: string; documento: string; email: string; telefone: string }) {
    const url = `https://api-sandbox.asaas.com/v3/customers`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: process.env.FINANCEIRO_CHAVE_API,
    };
    const body = {
      name: pagador.nome,
      cpfCnpj: pagador.documento,
      email: pagador.email,
      phone: pagador.telefone,
    };
    await this.connectionHub.http?.post(url, body, { headers });
    return this.buscarCliente(pagador);
  }

  private async buscarParcelas(installment: string): Promise<
    {
      gatewayRef: string;
      nossoNumero: string;
      urlBoleto: string;
      vancimento: string;
      linkBoleto: string;
      codigoBarras: string;
      linhaDigitavel: string;
      pix: string;
      valorCobranca: number;
      valorComDescontoGateway: number;
    }[]
  > {
    try {
      const url = `https://api-sandbox.asaas.com/v3/installments/${installment}/payments?limit=24`;
      const headers = {
        accept: "application/json",
        "User-Agent": "NomeDaSuaAplicacao/1.0.0",
        "content-type": "application/json",
        access_token: process.env.FINANCEIRO_CHAVE_API,
      };
      const response = await this.connectionHub.http?.get(url, { headers });

      return response?.data?.data?.map((installment: any) => {
        return {
          gatewayRef: installment.id,
          nossoNumero: installment.nossoNumero,
          urlBoleto: installment.bankSlipUrl,
          vancimento: installment.dueDate,
          linkBoleto: installment.invoiceUrl,
          codigoBarras: null,
          linhaDigitavel: null,
          pix: installment.pixTransaction?.qrCode?.payload,
          valorCobranca: installment.value,
          valorComDescontoGateway: installment.netValue,
        };
      });
    } catch (error: any) {
      console.log(error);
      return [];
    }
  }
}
