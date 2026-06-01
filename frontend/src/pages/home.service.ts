import type { NotificacaoHttp } from "src/@modules/notificacao/notificacao.http";
import { inject } from "vue";

export class HomeService {
  private $notificacaoHttp = inject("notificacaoHttp") as NotificacaoHttp;

  constructor() {}

  enviarSms(input: any) {
    this.$notificacaoHttp.enviarSms(input);
  }
}
