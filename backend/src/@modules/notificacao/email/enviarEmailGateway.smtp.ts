import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { MensagemEntity } from "./mensagem.entity";
import * as nodemailer from "nodemailer";

export type GatewaySmtpConfig = {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
};

export class EnviarEmailGatewaySmtp {
  constructor(
    readonly connectionHub: ConnectionHub,
    readonly config?: GatewaySmtpConfig,
  ) {}

  async enviar(mensagem: MensagemEntity) {
    const host = this.config?.host ?? process.env.NOTIFICACAO_SMTP_HOST;
    const port = this.config?.port ?? process.env.NOTIFICACAO_SMTP_PORT;
    const secure = this.config?.secure ?? ["true", "TRUE", "1", "YES"].includes(process.env.NOTIFICACAO_SMTP_SECURE ?? "false");
    const user = this.config?.user ?? process.env.NOTIFICACAO_SMTP_USER;
    const pass = this.config?.pass ?? process.env.NOTIFICACAO_SMTP_PASS;

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
    const nomeAmigavel = mensagem.nomeAmigavel();
    const message = {
      from: nomeAmigavel ? `"${nomeAmigavel}" <${user}>` : user,
      to: mensagem.destinatario(),
      subject: mensagem.titulo(),
      html: mensagem.mensagem(),
      attachments: [],
      headers: {},
    };
    await transporter.sendMail(message);
  }
}
