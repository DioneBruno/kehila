import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { Vonage } from "@vonage/server-sdk";
import { Channels } from "@vonage/messages";
import { MensagemEntity } from "./mensagem.entity";

export class EnviarSmsGatewayVonage {
  constructor(readonly connectionHub: ConnectionHub) {}

  async enviar(mensagem: MensagemEntity) {
    const vonage = new Vonage({
      apiKey: process.env.NOTIFICACAO_VONAGE_APIKEY,
      apiSecret: process.env.NOTIFICACAO_VONAGE_APISECRET,
    });

    await vonage.messages.send({
      from: "Vonage APIs",
      messageType: "text",
      channel: Channels.SMS,
      text: mensagem.mensagem(),
      to: mensagem.destinatario(),
    });
  }
}
