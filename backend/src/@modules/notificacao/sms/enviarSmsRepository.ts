import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "./mensagem.entity";
import { EnviarSmsGatewayVonage } from "./enviarSmsGateway.vonage";
export class EnviarSmsRepository {
  constructor(readonly connectionsHub: ConnectionHub) {}

  async buscarGateway(mensagem: MensagemEntity) {
    const gateway = new EnviarSmsGatewayVonage(this.connectionsHub);
    return gateway;
  }
}
