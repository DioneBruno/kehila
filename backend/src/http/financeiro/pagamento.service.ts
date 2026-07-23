import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificarVencimentoPagamentoUsecase } from "src/@modules/financeiro/notificarVencimentoPagamento/notificarVencimentoPagamento.usecase";

@Injectable()
export class PagamentoService {
  constructor(readonly notificarVencimentoPagamentoUsecase: NotificarVencimentoPagamentoUsecase) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async executarTarefaCada10Segundos() {
    // lógica aqui
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async executarTarefaCadaMinuto() {
    // lógica aqui
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async executarTarefaCada10Minutos() {
    // lógica aqui
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async executarTarefaCada30Minutos() {
    // lógica aqui
  }

  @Cron(CronExpression.EVERY_HOUR)
  async executarTarefaCadaHora() {
    // lógica aqui
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async executarTarefaCada2Horas() {
    // lógica aqui
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async executarTarefaTodoDiaAs2h() {
    // lógica aqui
  }

}
