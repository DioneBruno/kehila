import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { Vonage } from "@vonage/server-sdk";
import { Channels } from "@vonage/messages";
import { MensagemEntity } from "./mensagem.entity";

export class EnviarSmsGatewayVonage {
  constructor(readonly connectionHub: ConnectionHub) {}

  async enviar(mensagem: MensagemEntity) {
    const vonage = new Vonage({
      apiKey: "3177d5a0",
      apiSecret: "!elxQ16SM3j",
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
