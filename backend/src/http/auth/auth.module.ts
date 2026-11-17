import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TokenGenerateUseCase } from "src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerate.usecase";
import { TokenGenerateRepository } from "src/@modules/auth/generateTokenAutenticationUsernamePassword/tokenGenerateRepository";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { DominioMiddleware } from "../middleware/dominio.middleware";
import { DecoderTokenAuthenticationUsecase } from "src/@modules/auth/decoderTokenAuthentication/decoderTokenAuthentication.uscase";
import { UserController } from "./user.controller";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";
import { GerarTokenAuthenticationUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/gerarTokenAuthentication.usecase";
import { GenerateTokenAuthenticationRandomCodeRepository } from "src/@modules/auth/generateTokenAuthenticationRandomCode/generateTokenAuthenticationRandomCodeRepository";
import { EnviarCodigoValidadorUsecase } from "src/@modules/auth/generateTokenAuthenticationRandomCode/enviarCodigoValidador.usecase";
import { UsuarioQuery } from "src/@modules/usuario/usuario.query";
import { TrustedDeviceUsecase } from "src/@modules/auth/trustedDevice/trustedDevice.usecase";
import { TrustedDeviceRepositoryPg } from "src/@modules/auth/trustedDevice/trustedDevice.repository";

@Module({
  imports: [],
  controllers: [AuthController, UserController],
  providers: [
    {
      provide: UsuarioQuery,
      useFactory: (connectionHub: ConnectionHub) => {
        return new UsuarioQuery(connectionHub);
      },
      inject: [ConnectionHub],
    },
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
    {
      provide: GenerateTokenAuthenticationRandomCodeRepository,
      useFactory: (connectionHub: ConnectionHub) => {
        return new GenerateTokenAuthenticationRandomCodeRepository(connectionHub);
      },
      inject: [ConnectionHub],
    },
    {
      provide: GerarTokenAuthenticationUsecase,
      useFactory: (repo: GenerateTokenAuthenticationRandomCodeRepository) => {
        return new GerarTokenAuthenticationUsecase(repo);
      },
      inject: [GenerateTokenAuthenticationRandomCodeRepository],
    },
    {
      provide: EnviarCodigoValidadorUsecase,
      useFactory: (repo: GenerateTokenAuthenticationRandomCodeRepository) => {
        return new EnviarCodigoValidadorUsecase(repo);
      },
      inject: [GenerateTokenAuthenticationRandomCodeRepository],
    },
    {
      provide: TrustedDeviceUsecase,
      useFactory: (connectionHub: ConnectionHub) => {
        return new TrustedDeviceUsecase(new TrustedDeviceRepositoryPg(connectionHub));
      },
      inject: [ConnectionHub],
    },
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DominioMiddleware).forRoutes("token-generate");
    consumer.apply(DominioMiddleware).forRoutes("random-code-authentication");
    consumer.apply(DominioMiddleware).forRoutes("trusted-device/login", "trusted-device/revoke");
    consumer.apply(JwtAuthMiddleware).forRoutes(UserController);
  }
}
