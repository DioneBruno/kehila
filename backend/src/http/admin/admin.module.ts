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

import { ConnectionStorageAwsS3 } from "src/@infra/storage/connectionStorage.awsS3";
import {
  EnviarImagemLoginUsecase,
  ImagemLoginRepository,
  ImagemLoginUrl,
  RemoverImagemLoginUsecase,
} from "src/@modules/empresa/layout/imagemLogin/imagemLogin";

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
    { provide: ImagemLoginUrl, useFactory: () => new ImagemLoginUrl(new ConnectionStorageAwsS3()) },
    {
      provide: EnviarImagemLoginUsecase,
      useFactory: (hub: ConnectionHub, urls: ImagemLoginUrl) => new EnviarImagemLoginUsecase(new ImagemLoginRepository(hub), new ConnectionStorageAwsS3(), urls),
      inject: [ConnectionHub, ImagemLoginUrl],
    },
    makeProvider(RemoverImagemLoginUsecase, (hub) => new RemoverImagemLoginUsecase(new ImagemLoginRepository(hub))),
    makeProvider(AdminQuery, (hub) => new AdminQuery(hub)),
    makeProvider(CadastrarEmpresaUsecase, (hub) => new CadastrarEmpresaUsecase(new CadastrarEmpresaRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(DefinirModulosEmpresaUsecase, (hub) => new DefinirModulosEmpresaUsecase(new DefinirModulosEmpresaRepository(hub))),
    makeProvider(EditarEmpresaUsecase, (hub) => new EditarEmpresaUsecase(new EditarEmpresaRepository(hub))),
    makeProvider(CriarDominioUsecase, (hub) => new CriarDominioUsecase(new CriarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(ListarDominiosUsecase, (hub) => new ListarDominiosUsecase(new ListarDominiosRepository(hub))),
    makeProvider(EditarDominioUsecase, (hub) => new EditarDominioUsecase(new EditarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(DeletarDominioUsecase, (hub) => new DeletarDominioUsecase(new DeletarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(CriarUsuarioUsecase, (hub) => new CriarUsuarioUsecase(new CriarUsuarioRepository(hub))),
    makeProvider(ListarUsuariosUsecase, (hub) => new ListarUsuariosUsecase(new ListarUsuariosRepository(hub))),
    makeProvider(DetalharUsuarioUsecase, (hub) => new DetalharUsuarioUsecase(new DetalharUsuarioRepository(hub))),
    makeProvider(EditarUsuarioUsecase, (hub) => new EditarUsuarioUsecase(new EditarUsuarioRepository(hub))),
    makeProvider(DeletarUsuarioUsecase, (hub) => new DeletarUsuarioUsecase(new DeletarUsuarioRepository(hub))),
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware, AdminMiddleware, ModuloAdminMiddleware).forRoutes(AdminEmpresaController);
  }
}
