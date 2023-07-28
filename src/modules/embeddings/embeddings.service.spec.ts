import { Test, TestingModule } from "@nestjs/testing";
import { EmbeddingsService } from "./embeddings.service";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PromptHistoryService } from "../prompt-history/prompt-history.service";

describe("EmbeddingsService", () => {
  let service: EmbeddingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingsService, PromptHistoryService, PrismaService, ConfigService],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
