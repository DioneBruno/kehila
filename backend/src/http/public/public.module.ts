import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { DominioMiddleware } from "../middleware/dominio.middleware";
import { PublicController } from "./public.controller";
import { LayoutQuery } from "src/@modules/empresa/layout/layout.query";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { ImagemLoginUrl } from "src/@modules/empresa/layout/imagemLogin/imagemLogin";
import { ConnectionStorageAwsS3 } from "src/@infra/storage/connectionStorage.awsS3";

@Module({
  controllers: [PublicController],
  providers: [
    {
      provide: LayoutQuery,
      useFactory: (connectionHub: ConnectionHub) => new LayoutQuery(connectionHub, new ImagemLoginUrl(new ConnectionStorageAwsS3())),
      inject: [ConnectionHub],
    },
  ],
})
export class PublicModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DominioMiddleware).forRoutes(PublicController);
  }
}
