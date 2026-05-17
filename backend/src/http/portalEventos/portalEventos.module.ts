import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { EventosController } from "./eventos.controller";
import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { CriarEventoUsecase } from "src/@modules/portalEventos/eventos/criarEvento/criarEvento.usecase";
import { CriarEventoRepository } from "src/@modules/portalEventos/eventos/criarEvento/criarEventoRepository";

import { ListarEventosUsecase } from "src/@modules/portalEventos/eventos/listarEventos/listarEventos.usecase";
import { ListarEventosRepository } from "src/@modules/portalEventos/eventos/listarEventos/listarEventosRepository";

import { DetalharEventoUsecase } from "src/@modules/portalEventos/eventos/detalharEvento/detalharEvento.usecase";
import { DetalharEventoRepository } from "src/@modules/portalEventos/eventos/detalharEvento/detalharEventoRepository";

import { EditarEventoUsecase } from "src/@modules/portalEventos/eventos/editarEvento/editarEvento.usecase";
import { EditarEventoRepository } from "src/@modules/portalEventos/eventos/editarEvento/editarEventoRepository";

import { AtualizarStatusEventoUsecase } from "src/@modules/portalEventos/eventos/atualizarStatusEvento/atualizarStatusEvento.usecase";
import { AtualizarStatusEventoRepository } from "src/@modules/portalEventos/eventos/atualizarStatusEvento/atualizarStatusEventoRepository";

function makeProvider<T>(
  token: new (...args: any[]) => T,
  factory: (hub: ConnectionHub) => T,
) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [EventosController],
  providers: [
    makeProvider(CriarEventoUsecase, (hub) => new CriarEventoUsecase(new CriarEventoRepository(hub))),
    makeProvider(ListarEventosUsecase, (hub) => new ListarEventosUsecase(new ListarEventosRepository(hub))),
    makeProvider(DetalharEventoUsecase, (hub) => new DetalharEventoUsecase(new DetalharEventoRepository(hub))),
    makeProvider(EditarEventoUsecase, (hub) => new EditarEventoUsecase(new EditarEventoRepository(hub))),
    makeProvider(
      AtualizarStatusEventoUsecase,
      (hub) => new AtualizarStatusEventoUsecase(new AtualizarStatusEventoRepository(hub)),
    ),
  ],
})
export class PortalEventosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(EventosController);
  }
}
