import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { InternoMiddleware } from "../middleware/perfil.middleware";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";
import { ModuloImoveisMiddleware } from "../middleware/modulo.middleware";

import { PessoasController } from "./pessoas.controller";

import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";

import { IncluirPessoaUsecase } from "src/@modules/imoveis/pessoas/incluirPessoa/incluirPessoa.usecase";
import { IncluirPessoaRepository } from "src/@modules/imoveis/pessoas/incluirPessoa/incluirPessoaRepository";

import { AlterarPessoaUsecase } from "src/@modules/imoveis/pessoas/alterarPessoa/alterarPessoa.usecase";
import { AlterarPessoaRepository } from "src/@modules/imoveis/pessoas/alterarPessoa/alterarPessoaRepository";

import { DeletarPessoaUsecase } from "src/@modules/imoveis/pessoas/deletarPessoa/deletarPessoa.usecase";
import { DeletarPessoaRepository } from "src/@modules/imoveis/pessoas/deletarPessoa/deletarPessoaRepository";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [PessoasController],
  providers: [
    makeProvider(ImoveisQuery, (hub) => new ImoveisQuery(hub)),
    makeProvider(IncluirPessoaUsecase, (hub) => new IncluirPessoaUsecase(new IncluirPessoaRepository(hub))),
    makeProvider(AlterarPessoaUsecase, (hub) => new AlterarPessoaUsecase(new AlterarPessoaRepository(hub))),
    makeProvider(DeletarPessoaUsecase, (hub) => new DeletarPessoaUsecase(new DeletarPessoaRepository(hub))),
  ],
})
export class ImoveisModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware, InternoMiddleware, ModuloImoveisMiddleware).forRoutes(PessoasController);
  }
}
