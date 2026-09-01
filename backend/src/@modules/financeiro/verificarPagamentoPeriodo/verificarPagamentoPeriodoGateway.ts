import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export type ContaBancariaAtiva = {
  companyUuid: string;
  chaveApi: string;
  ambiente: string;
};

export type PagamentoRecebidoAsaas = {
  id: string;
  value: number;
  paymentDate: string;
};

export class VerificarPagamentoPeriodoGateway {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarContasBancariasAtivas(companyUuid: string): Promise<ContaBancariaAtiva[]> {
    const contas = await this.connectionHub.database!.query<{ company_uuid: string; chave_api: string; ambiente: string }[]>(
      `SELECT company_uuid, chave_api, ambiente
      FROM financeiro_contas_bancarias
      WHERE deleted_at IS NULL
        AND company_uuid = $1
        AND status = 'ativo'`,
      [companyUuid],
    );
    return contas.map((conta) => ({
      companyUuid: conta.company_uuid,
      chaveApi: conta.chave_api,
      ambiente: conta.ambiente,
    }));
  }

  async listarPagamentosRecebidos(conta: ContaBancariaAtiva, dataInicial: string, dataFinal: string): Promise<PagamentoRecebidoAsaas[]> {
    const baseUrl = conta.ambiente === "PROD" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
    const url = `${baseUrl}/v3/payments?limit=100&offset=0&paymentDate[ge]=${dataInicial}&paymentDate[le]=${dataFinal}&status=RECEIVED`;
    const headers = {
      accept: "application/json",
      "User-Agent": "Kehila",
      "content-type": "application/json",
      access_token: conta.chaveApi,
    };
    const response = await this.connectionHub.http?.get<{ data: PagamentoRecebidoAsaas[] }>(url, { headers });
    return response?.data?.data ?? [];
  }
}
