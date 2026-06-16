import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { EmpresaController } from "./empresa.controller";
import { DominioController } from "./dominio.controller";

import { DetalharEmpresaUsecase } from "src/@modules/empresa/detalharEmpresa/detalharEmpresa.usecase";
import { DetalharEmpresaRepository } from "src/@modules/empresa/detalharEmpresa/detalharEmpresaRepository";

import { EditarEmpresaUsecase } from "src/@modules/empresa/editarEmpresa/editarEmpresa.usecase";
import { EditarEmpresaRepository } from "src/@modules/empresa/editarEmpresa/editarEmpresaRepository";

import { DeletarEmpresaUsecase } from "src/@modules/empresa/deletarEmpresa/deletarEmpresa.usecase";
import { DeletarEmpresaRepository } from "src/@modules/empresa/deletarEmpresa/deletarEmpresaRepository";

import { CriarDominioUsecase } from "src/@modules/empresa/dominio/criarDominio/criarDominio.usecase";
import { CriarDominioRepository } from "src/@modules/empresa/dominio/criarDominio/criarDominioRepository";

import { ListarDominiosUsecase } from "src/@modules/empresa/dominio/listarDominios/listarDominios.usecase";
import { ListarDominiosRepository } from "src/@modules/empresa/dominio/listarDominios/listarDominiosRepository";

import { EditarDominioUsecase } from "src/@modules/empresa/dominio/editarDominio/editarDominio.usecase";
import { EditarDominioRepository } from "src/@modules/empresa/dominio/editarDominio/editarDominioRepository";

import { DeletarDominioUsecase } from "src/@modules/empresa/dominio/deletarDominio/deletarDominio.usecase";
import { DeletarDominioRepository } from "src/@modules/empresa/dominio/deletarDominio/deletarDominioRepository";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [EmpresaController, DominioController],
  providers: [
    makeProvider(DetalharEmpresaUsecase, (hub) => new DetalharEmpresaUsecase(new DetalharEmpresaRepository(hub))),
    makeProvider(EditarEmpresaUsecase, (hub) => new EditarEmpresaUsecase(new EditarEmpresaRepository(hub))),
    makeProvider(DeletarEmpresaUsecase, (hub) => new DeletarEmpresaUsecase(new DeletarEmpresaRepository(hub))),
    makeProvider(CriarDominioUsecase, (hub) => new CriarDominioUsecase(new CriarDominioRepository(hub))),
    makeProvider(ListarDominiosUsecase, (hub) => new ListarDominiosUsecase(new ListarDominiosRepository(hub))),
    makeProvider(EditarDominioUsecase, (hub) => new EditarDominioUsecase(new EditarDominioRepository(hub))),
    makeProvider(DeletarDominioUsecase, (hub) => new DeletarDominioUsecase(new DeletarDominioRepository(hub))),
  ],
})
export class EmpresaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(EmpresaController, DominioController);
  }
}
