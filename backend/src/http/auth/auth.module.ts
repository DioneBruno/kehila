import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TokenGenerateUseCase } from "src/@modules/auth/tokenGenerate/tokenGenerate.usecase";
import { TokenGenerateRepository } from "src/@modules/auth/tokenGenerate/tokenGenerateRepository";
import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { DominioMiddleware } from "../middleware/dominio.middleware";

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    {
      provide: TokenGenerateUseCase,
      useFactory: (connectionHub: ConnectionHub) => {
        const repo = new TokenGenerateRepository(connectionHub);
        return new TokenGenerateUseCase(repo);
      },
      inject: [ConnectionHub],
    },
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DominioMiddleware).forRoutes("token-generate");
  }
}
