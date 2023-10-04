import { Module } from "@nestjs/common";
import { PrismaService } from "../../global-services/prisma.service";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

@Module({
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    PrismaService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class FeedbackModule {}
