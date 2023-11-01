import { Module } from "@nestjs/common";
import { PrismaService } from "../../global-services/prisma.service";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AiToolsService } from "../aiTools/ai-tools.service";

@Module({
  controllers: [FeedbackController],
  providers: [
    AiToolsService,
    ConfigService,
    FeedbackService,
    PrismaService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class FeedbackModule {}
