require("dotenv").config();
import { Global, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { PortalEventosModule } from "./portalEventos/portalEventos.module";
import { ConnectionHub } from "src/@modules/shared/connections/connectionHub";
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { NotificacaoModule } from "./notificacao/notificacao.module";
import { FinanceiroModule } from "./financeiro/financeiro.module";
import { EmpresaModule } from "./empresa/empresa.module";
import axios from "axios";
import { ConnectionCacheRedis } from "src/@infra/cache/cacheConnection.redis";
import { RedisClientType, createClient } from "redis";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.DB_DEFAULT_DRIVER as any,
      host: process.env.DB_DEFAULT_HOST,
      port: process.env.DB_DEFAULT_PORT as any,
      database: process.env.DB_DEFAULT_NAME,
      username: process.env.DB_DEFAULT_USENAME,
      schema: process.env.DB_DEFAULT_SCHEMA ?? "public",
      password: process.env.DB_DEFAULT_PASSWORD,
      ssl: ["1", "SIM", "TRUE", "True", "true", true, 1].includes(process.env.DB_DEFAULT_SSL as string),
    }),
    AuthModule,
    PortalEventosModule,
    FinanceiroModule,
    NotificacaoModule,
    EmpresaModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: ConnectionHub,
      useFactory: async (dataSource: DataSource) => {
        // HTTP
        const http = axios.create({
          baseURL: process.env.SYSTEM_URL_API,
          headers: {
            "Content-Type": "application/json",
          },
        });

        // CACHE
        const cacheClient: RedisClientType | any = await createClient({
          url: process.env.REDIS_URL,
        }).connect();
        const cache = new ConnectionCacheRedis(cacheClient);

        return new ConnectionHub({ database: dataSource, http, cache });
      },
      inject: [getDataSourceToken()],
    },
  ],
  exports: [ConnectionHub],
})
export class AppModule {}
