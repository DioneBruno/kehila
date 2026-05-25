import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { EventosController } from "./eventos.controller";
import { LotesController } from "./lotes.controller";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
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

import { CriarLoteUsecase } from "src/@modules/portalEventos/lotes/criarLote/criarLote.usecase";
import { CriarLoteRepository } from "src/@modules/portalEventos/lotes/criarLote/criarLoteRepository";

import { ListarLotesUsecase } from "src/@modules/portalEventos/lotes/listarLotes/listarLotes.usecase";
import { ListarLotesRepository } from "src/@modules/portalEventos/lotes/listarLotes/listarLotesRepository";

import { EditarLoteUsecase } from "src/@modules/portalEventos/lotes/editarLote/editarLote.usecase";
import { EditarLoteRepository } from "src/@modules/portalEventos/lotes/editarLote/editarLoteRepository";

import { RemoverLoteUsecase } from "src/@modules/portalEventos/lotes/removerLote/removerLote.usecase";
import { RemoverLoteRepository } from "src/@modules/portalEventos/lotes/removerLote/removerLoteRepository";

import { CriarTipoIngressoUsecase } from "src/@modules/portalEventos/lotes/criarTipoIngresso/criarTipoIngresso.usecase";
import { CriarTipoIngressoRepository } from "src/@modules/portalEventos/lotes/criarTipoIngresso/criarTipoIngressoRepository";

import { EditarTipoIngressoUsecase } from "src/@modules/portalEventos/lotes/editarTipoIngresso/editarTipoIngresso.usecase";
import { EditarTipoIngressoRepository } from "src/@modules/portalEventos/lotes/editarTipoIngresso/editarTipoIngressoRepository";

import { RemoverTipoIngressoUsecase } from "src/@modules/portalEventos/lotes/removerTipoIngresso/removerTipoIngresso.usecase";
import { RemoverTipoIngressoRepository } from "src/@modules/portalEventos/lotes/removerTipoIngresso/removerTipoIngressoRepository";
import { CriarPedidoUsecase } from "src/@modules/portalEventos/pedidos/criarPedido/criarPedido.usecase";
import { CriarPedidoRepository } from "src/@modules/portalEventos/pedidos/criarPedido/criarPedidoRepository";
import { FecharPedidoUsecase } from "src/@modules/portalEventos/pedidos/fecharPedido/fecharPedido.usecase";
import { FecharPedidoRepository } from "src/@modules/portalEventos/pedidos/fecharPedido/fecharPedidoRepository";
import { PortalEventosQuery } from "src/@modules/portalEventos/portalEventos.query";
import { PedidosController } from "./pedidos.controller";
import { DominioMiddleware } from "../middleware/dominio.middleware";
import { PublicoController } from "./publico.controller";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}
//
@Module({
  controllers: [EventosController, LotesController, PublicoController],
  providers: [
    makeProvider(PortalEventosQuery, (hub) => new PortalEventosQuery(hub)),
    makeProvider(CriarEventoUsecase, (hub) => new CriarEventoUsecase(new CriarEventoRepository(hub))),
    makeProvider(ListarEventosUsecase, (hub) => new ListarEventosUsecase(new ListarEventosRepository(hub))),
    makeProvider(DetalharEventoUsecase, (hub) => new DetalharEventoUsecase(new DetalharEventoRepository(hub))),
    makeProvider(EditarEventoUsecase, (hub) => new EditarEventoUsecase(new EditarEventoRepository(hub))),
    makeProvider(AtualizarStatusEventoUsecase, (hub) => new AtualizarStatusEventoUsecase(new AtualizarStatusEventoRepository(hub))),
    makeProvider(CriarLoteUsecase, (hub) => new CriarLoteUsecase(new CriarLoteRepository(hub))),
    makeProvider(ListarLotesUsecase, (hub) => new ListarLotesUsecase(new ListarLotesRepository(hub))),
    makeProvider(EditarLoteUsecase, (hub) => new EditarLoteUsecase(new EditarLoteRepository(hub))),
    makeProvider(RemoverLoteUsecase, (hub) => new RemoverLoteUsecase(new RemoverLoteRepository(hub))),
    makeProvider(CriarTipoIngressoUsecase, (hub) => new CriarTipoIngressoUsecase(new CriarTipoIngressoRepository(hub))),
    makeProvider(EditarTipoIngressoUsecase, (hub) => new EditarTipoIngressoUsecase(new EditarTipoIngressoRepository(hub))),
    makeProvider(RemoverTipoIngressoUsecase, (hub) => new RemoverTipoIngressoUsecase(new RemoverTipoIngressoRepository(hub))),
    makeProvider(CriarPedidoUsecase, (hub) => new CriarPedidoUsecase(new CriarPedidoRepository(hub))),
    makeProvider(FecharPedidoUsecase, (hub) => new FecharPedidoUsecase(new FecharPedidoRepository(hub))),
  ],
})
export class PortalEventosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DominioMiddleware).forRoutes(PublicoController);
    consumer.apply(JwtAuthMiddleware).forRoutes(EventosController, LotesController, PedidosController);
  }
}
