import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { PagamentoEntity } from "./pagamento.entity";

const ASAAS_SANDBOX_URL = "https://api-sandbox.asaas.com";
const ASAAS_PROD_URL = "https://api.asaas.com";

export class VerificarPagamentoGateway {
  constructor(readonly connectionHub: ConnectionHub) {}

  async verificarPagamento(pagamento: PagamentoEntity): Promise<{ dataPagamento: string; dataCreditado: string; valorPago: number }> {}
}
