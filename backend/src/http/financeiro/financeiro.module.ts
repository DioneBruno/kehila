import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { ContasBancariasController } from "./contasBancarias.controller";
import { CobrancasController } from "./cobrancas.controller";

import { CriarContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/criarContaBancaria/criarContaBancaria.usecase";
import { CriarContaBancariaRepository } from "src/@modules/financeiro/contaBancaria/criarContaBancaria/criarContaBancariaRepository";

import { ListarContasBancariasUsecase } from "src/@modules/financeiro/contaBancaria/listarContasBancarias/listarContasBancarias.usecase";
import { ListarContasBancariasRepository } from "src/@modules/financeiro/contaBancaria/listarContasBancarias/listarContasBancariasRepository";

import { DetalharContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/detalharContaBancaria/detalharContaBancaria.usecase";
import { DetalharContaBancariaRepository } from "src/@modules/financeiro/contaBancaria/detalharContaBancaria/detalharContaBancariaRepository";

import { EditarContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/editarContaBancaria/editarContaBancaria.usecase";
import { EditarContaBancariaRepository } from "src/@modules/financeiro/contaBancaria/editarContaBancaria/editarContaBancariaRepository";

import { DeletarContaBancariaUsecase } from "src/@modules/financeiro/contaBancaria/deletarContaBancaria/deletarContaBancaria.usecase";
import { DeletarContaBancariaRepository } from "src/@modules/financeiro/contaBancaria/deletarContaBancaria/deletarContaBancariaRepository";

import { ListarCobrancaUsecase } from "src/@modules/financeiro/listarCobranca/listarCobranca.usecase";
import { ListarCobrancaRepository } from "src/@modules/financeiro/listarCobranca/listarCobrancaRepository";
import { PagamentosController } from "./pagamentos.controller";

import { ListaPagamentoUsecase } from "src/@modules/financeiro/listaPagamento/listaPagamento.usecase";
import { ListaPagamentoRepository } from "src/@modules/financeiro/listaPagamento/listaPagamentoRepository";

import { VerificarPagamentoUsecase } from "src/@modules/financeiro/verificarPagamento/verificarPagamento.usecase";
import { VerificarPagamentoRepostiory } from "src/@modules/financeiro/verificarPagamento/verificarPagamentoRepository";
import { VerificarPagamentoGateway } from "src/@modules/financeiro/verificarPagamento/verificarPagamentoGateway";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [ContasBancariasController, CobrancasController, PagamentosController],
  providers: [
    makeProvider(CriarContaBancariaUsecase, (hub) => new CriarContaBancariaUsecase(new CriarContaBancariaRepository(hub))),
    makeProvider(ListarContasBancariasUsecase, (hub) => new ListarContasBancariasUsecase(new ListarContasBancariasRepository(hub))),
    makeProvider(DetalharContaBancariaUsecase, (hub) => new DetalharContaBancariaUsecase(new DetalharContaBancariaRepository(hub))),
    makeProvider(EditarContaBancariaUsecase, (hub) => new EditarContaBancariaUsecase(new EditarContaBancariaRepository(hub))),
    makeProvider(DeletarContaBancariaUsecase, (hub) => new DeletarContaBancariaUsecase(new DeletarContaBancariaRepository(hub))),
    makeProvider(ListarCobrancaUsecase, (hub) => new ListarCobrancaUsecase(new ListarCobrancaRepository(hub))),
    makeProvider(ListaPagamentoUsecase, (hub) => new ListaPagamentoUsecase(new ListaPagamentoRepository(hub))),
    makeProvider(
      VerificarPagamentoUsecase,
      (hub) => new VerificarPagamentoUsecase(new VerificarPagamentoRepostiory(hub), new VerificarPagamentoGateway(hub)),
    ),
  ],
})
export class FinanceiroModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(ContasBancariasController, CobrancasController, PagamentosController);
  }
}
