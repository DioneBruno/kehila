import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { DominioMiddleware } from "../middleware/dominio.middleware";
import { PublicController } from "./public.controller";
import { LayoutQuery } from "src/@modules/empresa/layout/layout.query";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";

@Module({
  controllers: [PublicController],
  providers: [
    {
      provide: LayoutQuery,
      useFactory: (connectionHub: ConnectionHub) => new LayoutQuery(connectionHub),
      inject: [ConnectionHub],
    },
  ],
})
export class PublicModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DominioMiddleware).forRoutes(PublicController);
  }
}
