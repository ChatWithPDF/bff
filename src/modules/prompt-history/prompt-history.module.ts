import { Module } from "@nestjs/common";
import { PromptHistoryService } from "./prompt-history.service";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [PromptHistoryService, PrismaService, ConfigService],
})
export class PromptHistoryModule {}
