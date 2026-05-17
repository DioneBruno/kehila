require("dotenv").config();
import { Global, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { PortalEventosModule } from "./portalEventos/portalEventos.module";
import { ConnectionHub } from "src/@modules/shared/connectionHub";
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

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
  ],
  controllers: [AppController],
  providers: [
    {
      provide: ConnectionHub,
      useFactory: (dataSource: DataSource) => {
        return new ConnectionHub(dataSource);
      },
      inject: [getDataSourceToken()],
    },
  ],
  exports: [ConnectionHub],
})
export class AppModule {}
