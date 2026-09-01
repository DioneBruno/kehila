import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export type ContaBancariaAtiva = {
  companyUuid: string;
  chaveApi: string;
  ambiente: string;
};

export type listarPagamentosRecebidosOutput = {
  id: string;
  value: number;
  paymentDate: string;
};

export class VerificarPagamentoPeriodoGateway {
  constructor(readonly connectionHub: ConnectionHub) {}

  async listarPagamentosRecebidos(conta: ContaBancariaAtiva, dataInicial: string, dataFinal: string): Promise<listarPagamentosRecebidosOutput[]> {
    const baseUrl = conta.ambiente === "PROD" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
    const headers = {
      accept: "application/json",
      "User-Agent": "Kehila",
      "content-type": "application/json",
      access_token: conta.chaveApi,
    };

    const limit = 100;
    let offset = 0;
    let hasMore = true;
    const pagamentos: listarPagamentosRecebidosOutput[] = [];

    while (hasMore) {
      const url = `${baseUrl}/v3/payments?limit=${limit}&offset=${offset}&paymentDate[ge]=${dataInicial}&paymentDate[le]=${dataFinal}&status=RECEIVED`;
      const response = await this.connectionHub.http?.get<{ data: listarPagamentosRecebidosOutput[]; hasMore: boolean }>(url, { headers });

      pagamentos.push(
        ...(response?.data?.data?.map((it) => ({
          id: it.id,
          value: it.value,
          paymentDate: it.paymentDate,
        })) ?? []),
      );
      hasMore = response?.data?.hasMore ?? false;
      offset += limit;
    }

    return pagamentos;
  }
}
