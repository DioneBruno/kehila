import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { EmpresaController } from "./empresa.controller";

import { DetalharEmpresaUsecase } from "src/@modules/empresa/detalharEmpresa/detalharEmpresa.usecase";
import { DetalharEmpresaRepository } from "src/@modules/empresa/detalharEmpresa/detalharEmpresaRepository";

import { EditarEmpresaUsecase } from "src/@modules/empresa/editarEmpresa/editarEmpresa.usecase";
import { EditarEmpresaRepository } from "src/@modules/empresa/editarEmpresa/editarEmpresaRepository";

import { DeletarEmpresaUsecase } from "src/@modules/empresa/deletarEmpresa/deletarEmpresa.usecase";
import { DeletarEmpresaRepository } from "src/@modules/empresa/deletarEmpresa/deletarEmpresaRepository";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [EmpresaController],
  providers: [
    makeProvider(DetalharEmpresaUsecase, (hub) => new DetalharEmpresaUsecase(new DetalharEmpresaRepository(hub))),
    makeProvider(EditarEmpresaUsecase, (hub) => new EditarEmpresaUsecase(new EditarEmpresaRepository(hub))),
    makeProvider(DeletarEmpresaUsecase, (hub) => new DeletarEmpresaUsecase(new DeletarEmpresaRepository(hub))),
  ],
})
export class EmpresaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(EmpresaController);
  }
}
