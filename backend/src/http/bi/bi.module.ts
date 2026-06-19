import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { BiController } from "./bi.controller";
import { BiRepository } from "src/@modules/bi/biRepostiory";
import { BiIncluirUsecase } from "src/@modules/bi/biIncluir.usecase";
import { BiEditarUsecase } from "src/@modules/bi/biEditar.usecase";
import { BiMontarUsecase } from "src/@modules/bi/biMontar.usecase";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";
import { BiGatewayMetabase } from "src/@modules/bi/biGateway.metabase";

@Module({
  controllers: [BiController],
  providers: [
    {
      provide: BiRepository,
      useFactory: (dataSource: DataSource) => {
        return new BiRepository(dataSource);
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: BiIncluirUsecase,
      useFactory: (repo: BiRepository) => {
        return new BiIncluirUsecase(repo);
      },
      inject: [BiRepository],
    },
    {
      provide: BiEditarUsecase,
      useFactory: (repo: BiRepository) => {
        return new BiEditarUsecase(repo);
      },
      inject: [BiRepository],
    },
    {
      provide: BiMontarUsecase,
      useFactory: (repo: BiRepository) => {
        const gateway = new BiGatewayMetabase();
        return new BiMontarUsecase(repo, gateway);
      },
      inject: [BiRepository],
    },
  ],
})
export class BiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes(BiController);
  }
}
