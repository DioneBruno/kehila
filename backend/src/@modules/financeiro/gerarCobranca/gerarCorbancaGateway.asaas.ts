import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { CobrancaEntity } from "./cobranca.entity";

export class GerarCobrancaGatewayAsaas {
  constructor(readonly connectionHub: ConnectionHub) {}

  async gerarCobranca(cobranca: CobrancaEntity) {
    const url = "https://api-sandbox.asaas.com/v3/payments";
    const headers = {
      accept: "application/json",
      "User-Agent": "NomeDaSuaAplicacao/1.0.0",
      "content-type": "application/json",
    };
    const body = {
      billingType: "boleto",
    };
    await this.connectionHub.http?.post(url, body, { headers });
  }
}
