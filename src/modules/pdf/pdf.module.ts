import { Module } from "@nestjs/common";
import { PDFService } from "./pdf.service";
import { PDFController } from "./pdf.controller";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AiToolsService } from "../aiTools/ai-tools.service";

@Module({
  imports:[],
  providers: [
    PDFService, 
    PrismaService, 
    ConfigService,
    AiToolsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    }
  ],
  controllers: [PDFController],
})
export class PDFModule {}
