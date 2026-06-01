import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { JwtAuthMiddleware } from "../middleware/jwtAuth.middleware";
import { NotificacaoController } from "./notificacao.controller";
import { EnviarSmsUsecase } from "src/@modules/notificacao/sms/enviarSms.usecase";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { EnviarSmsRepository } from "src/@modules/notificacao/sms/enviarSmsRepository";
import { EnviarEmailUsecase } from "src/@modules/notificacao/email/enviarEmail.usecase";
import { EnviarEmailRepository } from "src/@modules/notificacao/email/enviarEmailRepository";

@Module({
  controllers: [NotificacaoController],
  providers: [
    {
      provide: EnviarSmsUsecase,
      useFactory: (connectionHub: ConnectionHub) => {
        const repo = new EnviarSmsRepository(connectionHub);
        return new EnviarSmsUsecase(repo);
      },
      inject: [ConnectionHub],
    },
    {
      provide: EnviarEmailUsecase,
      useFactory: (connectionHub: ConnectionHub) => {
        const repo = new EnviarEmailRepository(connectionHub);
        return new EnviarEmailUsecase(repo);
      },
      inject: [ConnectionHub],
    },
  ],
})
export class NotificacaoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes("notificacoes/*");
  }
}
