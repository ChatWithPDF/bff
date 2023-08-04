import { BadRequestException, Injectable } from "@nestjs/common";
import {
  document as Document,
  prompt_history as PromptHistory,
} from "@prisma/client";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { CreatePromptDto, SearchPromptHistoryDto } from "./prompt.dto";
import { CustomLogger } from "../../common/logger";
import { AiToolsService } from "../aiTools/ai-tools.service";

export interface EmbeddingResponse {
  embedding: number[];
  text: string;
}

@Injectable()
export class PromptHistoryService {
  private logger: CustomLogger;
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private aiToolsService: AiToolsService
  ) {
    this.logger = new CustomLogger("PromptHistoryService");
    this.aiToolsService = new AiToolsService(configService)
  }
  async createOrUpdate(data: CreatePromptDto): Promise<PromptHistory> {
    let olderDocument;
    let document: PromptHistory;
    try {
      if (!isNaN(parseInt(data.id)))
        olderDocument = await this.prisma.prompt_history.findUnique({
          where: {
            id: parseInt(data.id),
          },
        });
      else if (data.queryInEnglish && data.queryInEnglish!='')
      olderDocument = await this.prisma.prompt_history.findUnique({
        where: {
          queryInEnglish: data.queryInEnglish
        },
      });
      if (olderDocument) {
        document = await this.prisma.prompt_history.update({
          where: { id: parseInt(olderDocument.id) },
          data: { timesUsed: olderDocument.timesUsed + 1 },
        });
      } else {
        let embedding = (await this.aiToolsService.getEmbedding(data.queryInEnglish))[0];
        try {
          document = await this.prisma.prompt_history.create({
            data: {
              queryInEnglish: data.queryInEnglish,
              responseInEnglish: data.responseInEnglish,
              timesUsed: 0,
              responseTime: data.responseTime,
              metadata: data.metadata,
              queryId: data.queryId,
              pdfId: data.pdfId
            },
          });
          await this.prisma.$queryRawUnsafe(
            `UPDATE prompt_history SET pdf = '[${embedding
              .map((x) => `${x}`)
              .join(",")}]' WHERE id = ${document.id}`
          );
        } catch(error) {
          this.logger.error(error)
        }
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
    return document;
  }

  async findByCriteria(searchQueryDto: SearchPromptHistoryDto): Promise<any> {
    const embedding: any = (
      await this.aiToolsService.getEmbedding(searchQueryDto.query)
    )[0];
    const results = await this.prisma
      .$queryRawUnsafe(`SELECT * FROM match_prompt_history(
                query_embedding := '[${embedding
                  .map((x) => `${x}`)
                  .join(",")}]',
                pdfId := ARRAY[${searchQueryDto.pdfIds.map((x)=>`'${x}'`).join(",")}],
                similarity_threshold := ${searchQueryDto.similarityThreshold},
                match_count := ${searchQueryDto.matchCount}
              );`);

    return results;
  }

  async findOne(id: number): Promise<Document | null> {
    try {
      let document = await this.prisma.document.findUnique({
        where: { id },
      });
      return document;
    } catch {
      return null;
    }
  }

  async softDeleteRelatedToDocument(documentId) {
    const affectedPromptHistories = await this.prisma.similarity_search_response.findMany({
      where: {
        documentId: documentId.id,
      },
      select: {
        queryId: true,
      },
    });
    // Soft delete the affected prompt_history records
    let updated = await Promise.all(
      affectedPromptHistories.map(({ queryId }) =>
        this.prisma.prompt_history.updateMany({
          where: {
            queryId,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
      ),
    );
    return updated
  }
}
