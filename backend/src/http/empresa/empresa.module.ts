import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { AdminMiddleware } from "../middleware/perfil.middleware";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

import { ConnectionStorageAwsS3 } from "src/@infra/storage/connectionStorage.awsS3";
import {
  EnviarImagemLoginUsecase,
  ImagemLoginRepository,
  ImagemLoginUrl,
  RemoverImagemLoginUsecase,
} from "src/@modules/empresa/layout/imagemLogin/imagemLogin";
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
  controllers: [EmpresaController, DominioController],
  providers: [
    { provide: ImagemLoginUrl, useFactory: () => new ImagemLoginUrl(new ConnectionStorageAwsS3()) },
    {
      provide: EnviarImagemLoginUsecase,
      useFactory: (hub: ConnectionHub, urls: ImagemLoginUrl) => new EnviarImagemLoginUsecase(new ImagemLoginRepository(hub), new ConnectionStorageAwsS3(), urls),
      inject: [ConnectionHub, ImagemLoginUrl],
    },
    makeProvider(RemoverImagemLoginUsecase, (hub) => new RemoverImagemLoginUsecase(new ImagemLoginRepository(hub))),
    makeProvider(DetalharEmpresaUsecase, (hub) => new DetalharEmpresaUsecase(new DetalharEmpresaRepository(hub))),
    makeProvider(EditarEmpresaUsecase, (hub) => new EditarEmpresaUsecase(new EditarEmpresaRepository(hub))),
    makeProvider(DeletarEmpresaUsecase, (hub) => new DeletarEmpresaUsecase(new DeletarEmpresaRepository(hub))),
    makeProvider(CriarDominioUsecase, (hub) => new CriarDominioUsecase(new CriarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(ListarDominiosUsecase, (hub) => new ListarDominiosUsecase(new ListarDominiosRepository(hub))),
    makeProvider(EditarDominioUsecase, (hub) => new EditarDominioUsecase(new EditarDominioRepository(hub), new DominioRegrasRepository(hub))),
    makeProvider(DeletarDominioUsecase, (hub) => new DeletarDominioUsecase(new DeletarDominioRepository(hub), new DominioRegrasRepository(hub))),
  ],
})
export class EmpresaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware, AdminMiddleware).forRoutes(EmpresaController, DominioController);
  }
}
