import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "./mensagem.entity";
import { EnviarEmailGatewaySmtp } from "./enviarEmailGateway.smtp";

export class EnviarEmailRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarGatewaty(email: MensagemEntity) {
    return new EnviarEmailGatewaySmtp(this.connectionHub);
  }
}
