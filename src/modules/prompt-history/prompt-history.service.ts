import { BadRequestException, Injectable } from "@nestjs/common";
import {
  document as Document,
  prompt_history as Prompt_History,
} from "@prisma/client";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { CreatePromptDto, GetPromptHistoryDto, SearchPromptHistoryDto, PromptHistory, PromptHistoryResponse } from "./prompt.dto";
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
    this.aiToolsService = new AiToolsService(configService, prisma)
  }
  // async createOrUpdate(data: CreatePromptDto): Promise<PromptHistory> {
  //   let olderDocument;
  //   let document: PromptHistory;
  //   try {
  //     if (!isNaN(parseInt(data.id)))
  //       olderDocument = await this.prisma.prompt_history.findUnique({
  //         where: {
  //           id: parseInt(data.id),
  //         },
  //       });
  //     else if (data.queryInEnglish && data.queryInEnglish!='')
  //     olderDocument = await this.prisma.prompt_history.findUnique({
  //       where: {
  //         queryInEnglish: data.queryInEnglish
  //       },
  //     });
  //     if (olderDocument) {
  //       document = await this.prisma.prompt_history.update({
  //         where: { id: parseInt(olderDocument.id) },
  //         data: { timesUsed: olderDocument.timesUsed + 1 },
  //       });
  //     } else {
  //       let embedding = (await this.aiToolsService.getEmbedding(data.queryInEnglish))[0];
  //       try {
  //         document = await this.prisma.prompt_history.create({
  //           data: {
  //             queryInEnglish: data.queryInEnglish,
  //             responseInEnglish: data.responseInEnglish,
  //             timesUsed: 0,
  //             responseTime: data.responseTime,
  //             metadata: data.metadata,
  //             queryId: data.queryId,
  //             pdfId: data.pdfId
  //           },
  //         });
  //         await this.prisma.$queryRawUnsafe(
  //           `UPDATE prompt_history SET pdf = '[${embedding
  //             .map((x) => `${x}`)
  //             .join(",")}]' WHERE id = ${document.id}`
  //         );
  //       } catch(error) {
  //         this.logger.error(error)
  //       }
  //     }
  //   } catch (error) {
  //     throw new BadRequestException(error);
  //   }
  //   return document;
  // }

  async create(queryId): Promise<Prompt_History> {
    try{
      let query = await this.prisma.query.findFirst({
        where: {
          id: queryId
        }
      })
      if(!query) return null
      let similarDocs = await this.prisma.similarity_search_response.findFirst({
        where: {
          queryId: queryId
        }
      })
      if(!similarDocs) return null
      let doc = await this.prisma.document.findFirst({
        where: {
          id: similarDocs.documentId
        }
      })
      if(!doc) return null
      let promptHistory = await this.prisma.prompt_history.findUnique({
        where:{
            queryInEnglish: query.query
        }
      })
      if(promptHistory) return null
      let embedding = (await this.aiToolsService.getEmbedding(query.query))[0];
      if(embedding){
        promptHistory = await this.prisma.prompt_history.create({
          data:{
            queryInEnglish: query.query,
            responseInEnglish: query.response,
            timesUsed: 0,
            responseTime: query.responseTime,
            metadata: {},
            queryId: query.id
          }
        })
        await this.prisma.$queryRawUnsafe(
          `UPDATE prompt_history SET embedding = '[${embedding
            .map((x) => `${x}`)
            .join(",")}]' WHERE id = ${promptHistory.id}`
        );
        return promptHistory
      } 
    } catch (error){
      console.log(error)
    }
  }

  async findByCriteria(searchQueryDto: SearchPromptHistoryDto): Promise<any> {
    const embedding: any = (
      await this.aiToolsService.getEmbedding(searchQueryDto.query)
    )[0];
    const queryEmbedding = `'[${embedding
                    .map((x) => `${x}`)
                    .join(",")}]'`
    const results = await this.prisma
      .$queryRawUnsafe(`
        SELECT
          prompt_history.id AS id,
          prompt_history."queryInEnglish" AS "queryInEnglish",
          prompt_history."responseInEnglish" AS "responseInEnglish",
          1 - (prompt_history.embedding <=> ${queryEmbedding}) AS similarity
        FROM
          prompt_history
        WHERE
          1 - (prompt_history.embedding <=> ${queryEmbedding}) > ${searchQueryDto.similarityThreshold}
        ORDER BY
          prompt_history.embedding <=> ${queryEmbedding}
        LIMIT ${searchQueryDto.matchCount};
      `);
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

  async findOneByExactQuery(query: string): Promise<PromptHistory | null> {
    try {
      const history: PromptHistory[]  = await this.prisma.$queryRaw`
      SELECT "createdAt", "updatedAt", id, "queryId", "responseTime", "queryInEnglish", "responseInEnglish"
      FROM prompt_history where "queryInEnglish" = ${query}
    `;
      return history[0];
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

  async getWithFilters(getDocumentsDto: GetPromptHistoryDto): Promise<any> {
    const page = getDocumentsDto.pagination.page || 1;
    const perPage = getDocumentsDto.pagination.perPage || 10;
    const embedding: any = (
      await this.aiToolsService.getEmbedding(getDocumentsDto.filter.query)
    )[0];
    let query_embedding = `[${embedding
      .map((x) => `${x}`)
      .join(",")}]`
    let similarity_threshold = getDocumentsDto.filter.similarityThreshold
    let match_count = getDocumentsDto.filter.matchCount
    let result = await this.prisma
    .$queryRawUnsafe(`
    WITH matched_docs AS (
      SELECT
      prompt_history.id as id,
      1 - (prompt_history.embedding <=> '${query_embedding}') as similarity
      FROM
        prompt_history
      WHERE 
        1 - (prompt_history.embedding <=> '${query_embedding}') > ${similarity_threshold}
      ORDER BY
        prompt_history.embedding <=> '${query_embedding}'
      LIMIT ${match_count}
    ), 
    total_count AS (
      SELECT COUNT(*) AS count
      FROM matched_docs
    )
    SELECT
      json_build_object(
        'pagination',
        json_build_object(
          'page', $1,
          'perPage', $2,
          'totalPages', CEIL(total_count.count::numeric / $2),
          'totalDocuments', total_count.count
        ),
        'documents',
        json_agg(
          json_build_object(
            'createdAt', doc."createdAt",
            'updatedAt', doc."updatedAt",
            'id', doc.id,
            'queryId', doc."queryId",
            'responseTime', doc."responseTime",
            'queryInEnglish', doc."queryInEnglish",
            'responseInEnglish', doc."responseInEnglish"
          ) ORDER BY matched_docs.similarity DESC
        )
      ) AS result
    FROM
      matched_docs
      JOIN document AS doc ON matched_docs.id = doc.id
      CROSS JOIN total_count
    GROUP BY total_count.count, $1, $2
    OFFSET (($1 - 1) * $2)
    LIMIT $2;
    
    `,page,perPage);
    return result[0]?.result || {
      pagination: {
        page: 1,
        perPage: 10,
        totalPages: 0,
        totalDocument: 0
      },
      documents: []
    };
  }

  async findAll(page: number, perPage: number) : Promise<PromptHistoryResponse>{
    // using raw sql inorder to get embeddings.
    const history:PromptHistory[]  = await this.prisma.$queryRaw`
      SELECT "createdAt", "updatedAt", id, "queryId", "responseTime", "queryInEnglish", "responseInEnglish"
      FROM prompt_history
      ORDER BY id
      OFFSET ${(page - 1) * perPage} 
      LIMIT ${perPage}
    `;
    const totalDocuments = await this.prisma.document.count();
    const totalPages = Math.ceil(totalDocuments / perPage);
    const pagination = { page, perPage, totalPages, totalDocuments };
    return { pagination, history };
  }
}
