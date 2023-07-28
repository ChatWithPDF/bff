import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PromptHistoryService } from "../prompt-history/prompt-history.service";
import { EmbeddingsService } from "../embeddings/embeddings.service";

@Module({
  providers: [
    PromptHistoryService,
    EmbeddingsService,
    ConfigService,
  ],
  controllers: [],
})
export class AiToolsModule {}
