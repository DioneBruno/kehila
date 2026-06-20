import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ApiError } from "src/@modules/shared/apiError";
import { PagamentoEntity } from "./pagamento.entity";

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export type VerificarPagamentoOutput = {
  status: string;
  dataPagamento: string;
  dataCreditado: string;
  valorPago: number;
} | null;

export class VerificarPagamentoGateway {
  constructor(readonly connectionHub: ConnectionHub) {}

  async verificarPagamento(pagamento: PagamentoEntity): Promise<VerificarPagamentoOutput> {
    const { token, baseUrl } = await this.buscarToken(pagamento);
    const url = `${baseUrl}/v3/lean/payments/${pagamento.bancoRef()}`;
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
      access_token: token,
    };
    const response = await this.connectionHub.http?.get(url, { headers });
    if (response?.data?.status !== "RECEIVED") return null;

    return {
      status: response.data.status,
      dataPagamento: response.data.customerPaymentDate,
      dataCreditado: response.data.creditDate,
      valorPago: response.data.originalValue,
    };
  }

  private async buscarToken(pagamento: PagamentoEntity): Promise<{ token: string; baseUrl: string }> {
    const [contaBancariaModel] = await this.connectionHub.database?.query(
      `SELECT chave_api, ambiente FROM financeiro_contas_bancarias WHERE deleted_at IS NULL AND company_uuid = $1 AND status = 'ativo'`,
      [pagamento.companyUuid()],
    );
    if (!contaBancariaModel) throw new ApiError("Conta bancária não encontrada", 400);
    const baseUrl = contaBancariaModel.ambiente === "PROD" ? ASAAS_PROD_URL : ASAAS_SANDBOX_URL;
    return { token: contaBancariaModel.chave_api, baseUrl };
  }
}
