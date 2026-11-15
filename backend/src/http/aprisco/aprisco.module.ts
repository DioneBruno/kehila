import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { ApriscoController } from "./aprisco.controller";

import { ApriscoQuery } from "src/@modules/aprisco/aprisco.query";

import { IncluirApriscoUsecase } from "src/@modules/aprisco/incluirAprisco/incluirAprisco.usecase";
import { IncluirApriscoRepository } from "src/@modules/aprisco/incluirAprisco/incluirApriscoRepository";

import { AlterarApriscoUsecase } from "src/@modules/aprisco/alterarAprisco/alterarAprisco.usecase";
import { AlterarApriscoRepository } from "src/@modules/aprisco/alterarAprisco/alterarApriscoRepository";

import { DeletarApriscoUsecase } from "src/@modules/aprisco/deletarAprisco/deletarAprisco.usecase";
import { DeletarApriscoRepository } from "src/@modules/aprisco/deletarAprisco/deletarApriscoRepository";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [ApriscoController],
  providers: [
    makeProvider(ApriscoQuery, (hub) => new ApriscoQuery(hub)),
    makeProvider(IncluirApriscoUsecase, (hub) => new IncluirApriscoUsecase(new IncluirApriscoRepository(hub))),
    makeProvider(AlterarApriscoUsecase, (hub) => new AlterarApriscoUsecase(new AlterarApriscoRepository(hub))),
    makeProvider(DeletarApriscoUsecase, (hub) => new DeletarApriscoUsecase(new DeletarApriscoRepository(hub))),
  ],
})
export class ApriscoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(ApriscoController);
  }
}
