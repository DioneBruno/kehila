import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { MembresiaController } from "./membresia.controller";

import { MembresiaQuery } from "src/@modules/membresia/membresia.query";

import { IncluirMembroUsecase } from "src/@modules/membresia/incluirMembro/incluirMembro.usecase";
import { IncluirMembroRepository } from "src/@modules/membresia/incluirMembro/incluirMembroRepository";

import { AlterarMembroUsecase } from "src/@modules/membresia/alterarMembro/alterarMembro.usecase";
import { AlterarMembroRepository } from "src/@modules/membresia/alterarMembro/alterarMembroRepository";

import { DeletarMembroUsecase } from "src/@modules/membresia/deletarMembro/deletarMembro.usecase";
import { DeletarMembroRepository } from "src/@modules/membresia/deletarMembro/deletarMembroRepository";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [MembresiaController],
  providers: [
    makeProvider(MembresiaQuery, (hub) => new MembresiaQuery(hub)),
    makeProvider(IncluirMembroUsecase, (hub) => new IncluirMembroUsecase(new IncluirMembroRepository(hub))),
    makeProvider(AlterarMembroUsecase, (hub) => new AlterarMembroUsecase(new AlterarMembroRepository(hub))),
    makeProvider(DeletarMembroUsecase, (hub) => new DeletarMembroUsecase(new DeletarMembroRepository(hub))),
  ],
})
export class MembresiaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(MembresiaController);
  }
}
