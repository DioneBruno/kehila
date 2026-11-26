import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { AdminMiddleware } from "../middleware/perfil.middleware";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";
import { ModuloAdminMiddleware } from "../middleware/modulo.middleware";

import { AdminEmpresaController } from "./adminEmpresa.controller";

import { AdminQuery } from "src/@modules/admin/admin.query";

import { CadastrarEmpresaUsecase } from "src/@modules/admin/cadastrarEmpresa/cadastrarEmpresa.usecase";
import { CadastrarEmpresaRepository } from "src/@modules/admin/cadastrarEmpresa/cadastrarEmpresaRepository";

import { DefinirModulosEmpresaUsecase } from "src/@modules/admin/definirModulos/definirModulosEmpresa.usecase";
import { DefinirModulosEmpresaRepository } from "src/@modules/admin/definirModulos/definirModulosEmpresaRepository";

import { EditarEmpresaUsecase } from "src/@modules/empresa/editarEmpresa/editarEmpresa.usecase";
import { EditarEmpresaRepository } from "src/@modules/empresa/editarEmpresa/editarEmpresaRepository";

import { CriarDominioUsecase } from "src/@modules/empresa/dominio/criarDominio/criarDominio.usecase";
import { CriarDominioRepository } from "src/@modules/empresa/dominio/criarDominio/criarDominioRepository";

import { ListarDominiosUsecase } from "src/@modules/empresa/dominio/listarDominios/listarDominios.usecase";
import { ListarDominiosRepository } from "src/@modules/empresa/dominio/listarDominios/listarDominiosRepository";

import { EditarDominioUsecase } from "src/@modules/empresa/dominio/editarDominio/editarDominio.usecase";
import { EditarDominioRepository } from "src/@modules/empresa/dominio/editarDominio/editarDominioRepository";

import { DominioRegrasRepository } from "src/@modules/empresa/dominio/dominioRegras";
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
  controllers: [AdminEmpresaController],
  providers: [
    makeProvider(AdminQuery, (hub) => new AdminQuery(hub)),
    makeProvider(CadastrarEmpresaUsecase, (hub) => new CadastrarEmpresaUsecase(new CadastrarEmpresaRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(DefinirModulosEmpresaUsecase, (hub) => new DefinirModulosEmpresaUsecase(new DefinirModulosEmpresaRepository(hub))),
    makeProvider(EditarEmpresaUsecase, (hub) => new EditarEmpresaUsecase(new EditarEmpresaRepository(hub))),
    makeProvider(CriarDominioUsecase, (hub) => new CriarDominioUsecase(new CriarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(ListarDominiosUsecase, (hub) => new ListarDominiosUsecase(new ListarDominiosRepository(hub))),
    makeProvider(EditarDominioUsecase, (hub) => new EditarDominioUsecase(new EditarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(DeletarDominioUsecase, (hub) => new DeletarDominioUsecase(new DeletarDominioRepository(hub), new DominioRegrasRepository(hub))),
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware, AdminMiddleware, ModuloAdminMiddleware).forRoutes(AdminEmpresaController);
  }
}
