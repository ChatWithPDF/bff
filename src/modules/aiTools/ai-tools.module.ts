import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmbeddingsService } from "../embeddings/embeddings.service";
import { AIToolsController } from "./ai-tools.controller";
import { PrismaService } from "src/global-services/prisma.service";
import { AiToolsService } from "./ai-tools.service";

@Module({
  providers: [
    EmbeddingsService,
    ConfigService,
    PrismaService,
    AiToolsService
  ],
  controllers: [
    AIToolsController
  ],
})
export class AiToolsModule {}
