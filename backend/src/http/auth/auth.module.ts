import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TokenGenerateUseCase } from "src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerate.usecase";
import { TokenGenerateRepository } from "src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerateRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { DominioMiddleware } from "../middleware/dominio.middleware";
import { DecoderTokenAuthenticationUsecase } from "src/@modules/auth/decoderTokenAuthentication/decoderTokenAuthentication.uscase";
import { UserController } from "./user.controller";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";

@Module({
  imports: [],
  controllers: [AuthController, UserController],
  providers: [
    {
      provide: TokenGenerateUseCase,
      useFactory: (connectionHub: ConnectionHub) => {
        const repo = new TokenGenerateRepository(connectionHub);
        return new TokenGenerateUseCase(repo);
      },
      inject: [ConnectionHub],
    },
    {
      provide: DecoderTokenAuthenticationUsecase,
      useFactory: () => {
        return new DecoderTokenAuthenticationUsecase();
      },
      inject: [],
    },
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DominioMiddleware).forRoutes("token-generate");
    consumer.apply(JwtAuthMiddleware).forRoutes(UserController);
  }
}
