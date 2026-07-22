import type HttpClient from "../http/httpClient.interface";

export class NotificacaoHttp {
  constructor(readonly http: HttpClient) {}

  async salvarGateway(gateway: any) {
    return await this.http.post("notificacoes/salvar-gateway", gateway);
  }

  async listarGateways() {
    return await this.http.get("notificacoes/listar-gateways");
  }

  async enviarSms(input: any) {
    return await this.http.post("notificacoes/enviar-sms", input);
  }

  async enviarEmail(input: any) {
    return await this.http.post("notificacoes/enviar-email", input);
  }
}
