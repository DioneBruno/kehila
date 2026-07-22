import { NotificacaoHttp } from "src/@modules/notificacao/notificacao.http";
import { inject } from "vue";

export class NotigicacaoService {
  private $notificacaoHttp = inject("notificacaoHttp") as NotificacaoHttp;
  constructor() {}

  async listarGateways() {
    const response = await this.$notificacaoHttp.listarGateways();
    return response;
  }

  async salvarGateway(gateway: any) {
    await this.$notificacaoHttp.salvarGateway(gateway);
  }
}