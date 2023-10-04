import { Module, ValidationPipe } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaService } from "./global-services/prisma.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmbeddingsModule } from "./modules/embeddings/embeddings.module";
import { UserModule } from "./modules/user/user.module";
import { EmbeddingsService } from "./modules/embeddings/embeddings.service";
import { PromptHistoryService } from "./modules/prompt-history/prompt-history.service";
import { APP_PIPE } from "@nestjs/core";
import { CustomLogger } from "./common/logger";
import { AiToolsService } from "./modules/aiTools/ai-tools.service";
import { PDFModule } from "./modules/pdf/pdf.module";
import { AiToolsModule } from "./modules/aiTools/ai-tools.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    EmbeddingsModule,
    UserModule,
    PDFModule,
    AiToolsModule,
    FeedbackModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    ConfigService,
    AiToolsService,
    EmbeddingsService,
    PromptHistoryService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    CustomLogger
  ],
})
export class AppModule {}
