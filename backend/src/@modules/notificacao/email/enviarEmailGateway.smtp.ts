import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "./mensagem.entity";
import * as nodemailer from "nodemailer";

export class EnviarEmailGatewaySmtp {
  constructor(readonly connectionHub: ConnectionHub) {}

  async enviar(mensagem: MensagemEntity) {
    const host = process.env.NOTIFICACAO_SMTP_HOST;
    const port = process.env.NOTIFICACAO_SMTP_PORT;
    const secure = ["true", "TRUE", "1", "YES"].includes(process.env.NOTIFICACAO_SMTP_SECURE ?? "false");
    const user = process.env.NOTIFICACAO_SMTP_USER;
    const pass = process.env.NOTIFICACAO_SMTP_PASS;

    const options = {
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: { rejectUnauthorized: false },
    };

    const transporter = nodemailer.createTransport(options);
    const message = {
      from: user,
      to: mensagem.destinatario(),
      subject: mensagem.titulo(),
      html: mensagem.mensagem(),
      attachments: [],
      headers: {},
    };
    await transporter.sendMail(message);
  }
}
