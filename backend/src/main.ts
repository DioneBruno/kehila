import { NestFactory } from "@nestjs/core";
import { AppModule } from "./http/app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { GlobalErrorFilter } from "./http/shared/globalErrorFilter";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalFilters(new GlobalErrorFilter());

  // Necessário para req.ip retornar o IP real do cliente quando atrás de proxy/nginx
  app.set("trust proxy", 1);

  app.enableCors({
    credentials: false,
    origin: "*",
    methods: ["OPTIONS", "GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Tenant", "Platform"],
    exposedHeaders: ["Content-Disposition"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useBodyParser("text");

  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
