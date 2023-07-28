import { Test, TestingModule } from "@nestjs/testing";
import { EmbeddingsController } from "./embeddings.controller";
import { EmbeddingsService } from "./embeddings.service";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PromptHistoryService } from "../prompt-history/prompt-history.service";

describe("EmbeddingsController", () => {
  let controller: EmbeddingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmbeddingsController],
      providers: [EmbeddingsService, PromptHistoryService, PrismaService, ConfigService],
    }).compile();

    controller = module.get<EmbeddingsController>(EmbeddingsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
