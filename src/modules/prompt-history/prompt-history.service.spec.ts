import { Test, TestingModule } from "@nestjs/testing";
import {
  EmbeddingResponse,
  PromptHistoryService,
} from "./prompt-history.service";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { CreatePromptDto, SearchPromptHistoryDto } from "./prompt.dto";
import { PrismaServiceMock } from "../../global-services/mock.prisma.service";
import fetch, { Response } from "node-fetch";

jest.mock("node-fetch");

class MockHeaders {
  headers: Record<string, string> = {};

  append(key: string, value: string) {
    this.headers[key] = value;
  }
}

describe("PromptHistoryService", () => {
  let service: PromptHistoryService;
  let prisma: typeof PrismaServiceMock;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptHistoryService, PrismaService, ConfigService],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .compile();

    service = module.get<PromptHistoryService>(PromptHistoryService);
    prisma = module.get(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a new PromptHistory if no existing record is found", async () => {
    const createPromptDto: CreatePromptDto = {
      id: "1",
      queryInEnglish: "Test query",
      responseInEnglish: "Test response",
      responseTime: 10,
      metadata: {},
      queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73",
      pdfId: "7d876d45-af93-4cf3-ae47-9aad551dea93"
    };

    const embeddingResponse: EmbeddingResponse[] = [
      {
        embedding: [0.1, 0.2, 0.3],
        text: "Test query",
      },
    ];
    const testUsers = [];
    prisma.prompt_history.findUnique = jest.fn().mockResolvedValue(null);
    prisma.prompt_history.create = jest.fn().mockResolvedValue({
      id: 1,
      queryInEnglish: "Test query",
      responseInEnglish: "Test response",
      timesUsed: 0,
      responseTime: 10,
      metadata: {},
      queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73"
    });
    prisma.prompt_history.update = jest.fn();

    configService.get = jest.fn().mockReturnValue("test-ai-tools-url");
    service.getEmbedding = jest.fn().mockResolvedValue(embeddingResponse);
    prisma.$queryRawUnsafe = jest.fn();

    const result = await service.createOrUpdate(createPromptDto);

    expect(result).toEqual({
      id: 1,
      queryInEnglish: "Test query",
      responseInEnglish: "Test response",
      timesUsed: 0,
      responseTime: 10,
      metadata: {},
      queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73"
    });
    expect(prisma.prompt_history.create).toHaveBeenCalled();
  });

  it("should update an existing PromptHistory record if found", async () => {
    const createPromptDto: CreatePromptDto = {
      id: "1",
      queryInEnglish: "Test query",
      responseInEnglish: "Test response",
      responseTime: 10,
      metadata: {},
      queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73",
      pdfId: "7d876d45-af93-4cf3-ae47-9aad551dea93"
    };

    const existingPromptHistory = {
      id: 1,
      queryInEnglish: "Test query",
      responseInEnglish: "Test response",
      timesUsed: 0,
      responseTime: 10,
      metadata: {},
      queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73"
    };

    prisma.prompt_history.findUnique = jest
      .fn()
      .mockResolvedValue(existingPromptHistory);
    prisma.prompt_history.update = jest.fn().mockResolvedValue({
      ...existingPromptHistory,
      timesUsed: existingPromptHistory.timesUsed + 1,
    });
    prisma.prompt_history.create = jest.fn();

    const result = await service.createOrUpdate(createPromptDto);

    expect(result).toEqual({
      id: 1,
      queryInEnglish: "Test query",
      responseInEnglish: "Test response",
      timesUsed: 1,
      responseTime: 10,
      metadata: {},
      queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73"
    });
    expect(prisma.prompt_history.update).toHaveBeenCalled();
  });

  it("should return results from match_prompt_history", async () => {
    const searchQueryDto: SearchPromptHistoryDto = {
      query: "Test query",
      similarityThreshold: 0.7,
      matchCount: 10,
      pdfId: ''
    };

    const embeddingResponse: EmbeddingResponse[] = [
      {
        embedding: [0.1, 0.2, 0.3],
        text: "Test query",
      },
    ];

    service.getEmbedding = jest.fn().mockResolvedValue(embeddingResponse);
    prisma.$queryRawUnsafe = jest.fn().mockResolvedValue([
      {
        id: 1,
        queryInEnglish: "Test query",
        responseInEnglish: "Test response",
        timesUsed: 0,
        responseTime: 10,
        metadata: {},
        queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73"
      },
    ]);

    const results = await service.findByCriteria(searchQueryDto);

    expect(results).toEqual([
      {
        id: 1,
        queryInEnglish: "Test query",
        responseInEnglish: "Test response",
        timesUsed: 0,
        responseTime: 10,
        metadata: {},
        queryId: "2d876d45-af93-4cf3-ae47-9aad551dea73"
      },
    ]);
  });
  it("should fetch embeddings from AI tools service", async () => {
    const query = "Test query";
    const expectedEmbeddingResponse: EmbeddingResponse[] = [
      {
        embedding: [0.1, 0.2, 0.3],
        text: "Test query",
      },
    ];

    configService.get = jest
      .fn()
      .mockReturnValue("https://test-ai-tools-url.com");
    global.Headers = MockHeaders as any;
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    const json = jest.fn() as jest.MockedFunction<any>;
    json.mockResolvedValue(expectedEmbeddingResponse);
    mockFetch.mockResolvedValue({
      expectedEmbeddingResponse,
      json,
    } as Response);
    global.fetch = mockFetch;

    const embeddings = await service.getEmbedding(query);

    expect(embeddings).toEqual(expectedEmbeddingResponse);
    expect(global.fetch).toHaveBeenCalled();
  });
});
