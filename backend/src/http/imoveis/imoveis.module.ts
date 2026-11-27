import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { InternoMiddleware } from "../middleware/perfil.middleware";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";
import { ModuloImoveisMiddleware } from "../middleware/modulo.middleware";

import { PessoasController } from "./pessoas.controller";
import { ImoveisController } from "./imoveis.controller";
import { ContratosController } from "./contratos.controller";
import { PainelController } from "./painel.controller";
import { ContasController } from "./contas.controller";

import { ConnectionStorageAwsS3 } from "src/@infra/storage/connectionStorage.awsS3";

import { ImoveisQuery } from "src/@modules/imoveis/imoveis.query";

import { IncluirPessoaUsecase } from "src/@modules/imoveis/pessoas/incluirPessoa/incluirPessoa.usecase";
import { IncluirPessoaRepository } from "src/@modules/imoveis/pessoas/incluirPessoa/incluirPessoaRepository";

import { AlterarPessoaUsecase } from "src/@modules/imoveis/pessoas/alterarPessoa/alterarPessoa.usecase";
import { AlterarPessoaRepository } from "src/@modules/imoveis/pessoas/alterarPessoa/alterarPessoaRepository";

import { DeletarPessoaUsecase } from "src/@modules/imoveis/pessoas/deletarPessoa/deletarPessoa.usecase";
import { DeletarPessoaRepository } from "src/@modules/imoveis/pessoas/deletarPessoa/deletarPessoaRepository";

import { IncluirImovelUsecase } from "src/@modules/imoveis/imoveis/incluirImovel/incluirImovel.usecase";
import { IncluirImovelRepository } from "src/@modules/imoveis/imoveis/incluirImovel/incluirImovelRepository";

import { AlterarImovelUsecase } from "src/@modules/imoveis/imoveis/alterarImovel/alterarImovel.usecase";
import { AlterarImovelRepository } from "src/@modules/imoveis/imoveis/alterarImovel/alterarImovelRepository";

import { DeletarImovelUsecase } from "src/@modules/imoveis/imoveis/deletarImovel/deletarImovel.usecase";
import { DeletarImovelRepository } from "src/@modules/imoveis/imoveis/deletarImovel/deletarImovelRepository";

import { IncluirContratoUsecase } from "src/@modules/imoveis/contratos/incluirContrato/incluirContrato.usecase";
import { IncluirContratoRepository } from "src/@modules/imoveis/contratos/incluirContrato/incluirContratoRepository";

import { AlterarContratoUsecase } from "src/@modules/imoveis/contratos/alterarContrato/alterarContrato.usecase";
import { AlterarContratoRepository } from "src/@modules/imoveis/contratos/alterarContrato/alterarContratoRepository";

import { RegistrarEventoContratoUsecase } from "src/@modules/imoveis/contratos/registrarEventoContrato/registrarEventoContrato.usecase";
import { RegistrarEventoContratoRepository } from "src/@modules/imoveis/contratos/registrarEventoContrato/registrarEventoContratoRepository";

import { IncluirContaUsecase } from "src/@modules/imoveis/contas/incluirConta/incluirConta.usecase";
import { IncluirContaRepository } from "src/@modules/imoveis/contas/incluirConta/incluirContaRepository";
import { GerarParcelasUsecase } from "src/@modules/imoveis/contas/gerarParcelas/gerarParcelas.usecase";
import { AlterarContaUsecase } from "src/@modules/imoveis/contas/alterarConta/alterarConta.usecase";
import { AlterarContaRepository } from "src/@modules/imoveis/contas/alterarConta/alterarContaRepository";
import { DeletarContaUsecase } from "src/@modules/imoveis/contas/deletarConta/deletarConta.usecase";
import { DeletarContaRepository } from "src/@modules/imoveis/contas/deletarConta/deletarContaRepository";
import { PagamentoContaUsecase } from "src/@modules/imoveis/contas/pagamentoConta/pagamentoConta.usecase";
import { PagamentoContaRepository } from "src/@modules/imoveis/contas/pagamentoConta/pagamentoContaRepository";
import {
  AnexosContaRepository,
  EnviarAnexoContaUsecase,
  RemoverAnexoContaUsecase,
  UrlAnexoContaUsecase,
} from "src/@modules/imoveis/contas/anexos/anexosConta";

function makeProvider<T>(token: new (...args: any[]) => T, factory: (hub: ConnectionHub) => T) {
  return {
    provide: token,
    useFactory: (connectionHub: ConnectionHub) => factory(connectionHub),
    inject: [ConnectionHub],
  };
}

@Module({
  controllers: [PessoasController, ImoveisController, ContratosController, PainelController, ContasController],
  providers: [
    makeProvider(ImoveisQuery, (hub) => new ImoveisQuery(hub)),
    makeProvider(IncluirPessoaUsecase, (hub) => new IncluirPessoaUsecase(new IncluirPessoaRepository(hub))),
    makeProvider(AlterarPessoaUsecase, (hub) => new AlterarPessoaUsecase(new AlterarPessoaRepository(hub))),
    makeProvider(DeletarPessoaUsecase, (hub) => new DeletarPessoaUsecase(new DeletarPessoaRepository(hub))),
    makeProvider(IncluirImovelUsecase, (hub) => new IncluirImovelUsecase(new IncluirImovelRepository(hub))),
    makeProvider(AlterarImovelUsecase, (hub) => new AlterarImovelUsecase(new AlterarImovelRepository(hub))),
    makeProvider(DeletarImovelUsecase, (hub) => new DeletarImovelUsecase(new DeletarImovelRepository(hub))),
    makeProvider(IncluirContratoUsecase, (hub) => new IncluirContratoUsecase(new IncluirContratoRepository(hub))),
    makeProvider(AlterarContratoUsecase, (hub) => new AlterarContratoUsecase(new AlterarContratoRepository(hub))),
    makeProvider(RegistrarEventoContratoUsecase, (hub) => new RegistrarEventoContratoUsecase(new RegistrarEventoContratoRepository(hub))),
    makeProvider(IncluirContaUsecase, (hub) => new IncluirContaUsecase(new IncluirContaRepository(hub))),
    makeProvider(GerarParcelasUsecase, (hub) => new GerarParcelasUsecase(new IncluirContaRepository(hub))),
    makeProvider(AlterarContaUsecase, (hub) => new AlterarContaUsecase(new AlterarContaRepository(hub))),
    makeProvider(DeletarContaUsecase, (hub) => new DeletarContaUsecase(new DeletarContaRepository(hub))),
    makeProvider(PagamentoContaUsecase, (hub) => new PagamentoContaUsecase(new PagamentoContaRepository(hub))),
    makeProvider(EnviarAnexoContaUsecase, (hub) => new EnviarAnexoContaUsecase(new AnexosContaRepository(hub), new ConnectionStorageAwsS3())),
    makeProvider(UrlAnexoContaUsecase, (hub) => new UrlAnexoContaUsecase(new AnexosContaRepository(hub), new ConnectionStorageAwsS3())),
    makeProvider(RemoverAnexoContaUsecase, (hub) => new RemoverAnexoContaUsecase(new AnexosContaRepository(hub))),
  ],
})
export class ImoveisModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtAuthMiddleware, InternoMiddleware, ModuloImoveisMiddleware)
      .forRoutes(PessoasController, ImoveisController, ContratosController, PainelController, ContasController);
  }
}
