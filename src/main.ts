import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { PrismaService } from "./global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import compression from "@fastify/compress";
import { join } from "path";
import { CustomLogger } from "./common/logger";

async function bootstrap() {
  const logger = new CustomLogger("Main");

  /** Fastify Application */
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  /** Register Prismaservice LifeCycle hooks */
  const prismaService: PrismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  /** Global prefix: Will result in appending of keyword 'admin' at the start of all the request */
  const configService = app.get<ConfigService>(ConfigService);
  app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, "data:", "validator.swagger.io"],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });

  app.enableCors();
  await app.register(multipart);
  await app.register(compression, { encodings: ["gzip", "deflate"] });
  app.useStaticAssets({ root: join(__dirname, "../../fileUploads") });
  await app.listen(3000, "0.0.0.0");
}

bootstrap();
