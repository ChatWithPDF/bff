import { Module } from "@nestjs/common";
import { EmbeddingsService } from "./embeddings.service";
import { EmbeddingsController } from "./embeddings.controller";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PromptHistoryService } from "../prompt-history/prompt-history.service";
import { AiToolsService } from "../aiTools/ai-tools.service";

@Module({
  providers: [
    EmbeddingsService, 
    PromptHistoryService,
    PrismaService, 
    ConfigService,
    AiToolsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    }
  ],
  controllers: [EmbeddingsController],
})
export class EmbeddingsModule {}
