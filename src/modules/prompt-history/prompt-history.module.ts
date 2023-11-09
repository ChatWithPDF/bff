import { Module } from "@nestjs/common";
import { PromptHistoryService } from "./prompt-history.service";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PromptHistoryController } from "./prompt-history.controller";
import { AiToolsService } from "../aiTools/ai-tools.service";

@Module({
  providers: [PromptHistoryService, PrismaService, ConfigService, AiToolsService],
  controllers: [PromptHistoryController]
})
export class PromptHistoryModule {}
