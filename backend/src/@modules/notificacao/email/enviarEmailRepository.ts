import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "./mensagem.entity";
import { EnviarEmailGatewaySmtp } from "./enviarEmailGateway.smtp";

export class EnviarEmailRepository {
  constructor(readonly connectionHub: ConnectionHub) {}

  async buscarGatewaty(email: MensagemEntity) {
    const [row] = await this.connectionHub.database!.query(
      `SELECT * FROM notificacao_gateways
        WHERE company_uuid = $1 AND type = $2 AND status = 'ativo' AND deleted_at IS NULL
        LIMIT 1`,
      [email.companyUuid(), "email"],
    );

    if (!row) {
      return new EnviarEmailGatewaySmtp(this.connectionHub);
    }

    const meta = row.meta ?? {};
    return new EnviarEmailGatewaySmtp(this.connectionHub, {
      host: meta.host,
      port: meta.port,
      secure: ["true", "TRUE", "1", "YES"].includes(meta.secure ?? "false"),
      user: row.usuario,
      pass: row.senha,
    });
  }
}
