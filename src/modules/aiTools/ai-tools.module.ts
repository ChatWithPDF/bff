import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PromptHistoryService } from "../prompt-history/prompt-history.service";
import { EmbeddingsService } from "../embeddings/embeddings.service";
import { AIToolsController } from "./ai-tools.controller";
import { PrismaService } from "src/global-services/prisma.service";
import { AiToolsService } from "./ai-tools.service";

@Module({
  providers: [
    PromptHistoryService,
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
