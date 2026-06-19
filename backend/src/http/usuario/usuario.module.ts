import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { UsuarioController } from "./usuario.controller";

import { CriarUsuarioUsecase } from "src/@modules/usuario/criarUsuario/criarUsuario.usecase";
import { CriarUsuarioRepository } from "src/@modules/usuario/criarUsuario/criarUsuarioRepository";

import { ListarUsuariosUsecase } from "src/@modules/usuario/listarUsuarios/listarUsuarios.usecase";
import { ListarUsuariosRepository } from "src/@modules/usuario/listarUsuarios/listarUsuariosRepository";

import { DetalharUsuarioUsecase } from "src/@modules/usuario/detalharUsuario/detalharUsuario.usecase";
import { DetalharUsuarioRepository } from "src/@modules/usuario/detalharUsuario/detalharUsuarioRepository";

import { EditarUsuarioUsecase } from "src/@modules/usuario/editarUsuario/editarUsuario.usecase";
import { EditarUsuarioRepository } from "src/@modules/usuario/editarUsuario/editarUsuarioRepository";

import { DeletarUsuarioUsecase } from "src/@modules/usuario/deletarUsuario/deletarUsuario.usecase";
import { DeletarUsuarioRepository } from "src/@modules/usuario/deletarUsuario/deletarUsuarioRepository";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [UsuarioController],
  providers: [
    makeProvider(CriarUsuarioUsecase, (hub) => new CriarUsuarioUsecase(new CriarUsuarioRepository(hub))),
    makeProvider(ListarUsuariosUsecase, (hub) => new ListarUsuariosUsecase(new ListarUsuariosRepository(hub))),
    makeProvider(DetalharUsuarioUsecase, (hub) => new DetalharUsuarioUsecase(new DetalharUsuarioRepository(hub))),
    makeProvider(EditarUsuarioUsecase, (hub) => new EditarUsuarioUsecase(new EditarUsuarioRepository(hub))),
    makeProvider(DeletarUsuarioUsecase, (hub) => new DeletarUsuarioUsecase(new DeletarUsuarioRepository(hub))),
  ],
})
export class UsuarioModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(UsuarioController);
  }
}
