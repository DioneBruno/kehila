import { Injectable } from "@nestjs/common";
import { NotificarVencimentoPagamentoUsecase } from "src/@modules/financeiro/notificarVencimentoPagamento/notificarVencimentoPagamento.usecase";

@Injectable()
export class PagamentoService {
  constructor(readonly notificarVencimentoPagamentoUsecase: NotificarVencimentoPagamentoUsecase) {}
}
