import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateDocumentDto, SearchQueryDto, GetDocumentsDto } from "./embeddings.dto";
import { document as Document } from "@prisma/client";
import { PrismaService } from "../../global-services/prisma.service";
import { ConfigService } from "@nestjs/config";
import { DocumentsResponse, DocumentWithEmbedding } from "./embeddings.model";
import { PromptHistoryService } from "../prompt-history/prompt-history.service";
import { AiToolsService } from "../aiTools/ai-tools.service";

interface EmbeddingResponse {
  embedding: number[];
  text: string;
}

@Injectable()
export class EmbeddingsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private promptHistoryService: PromptHistoryService,
    private aiToolsService: AiToolsService
  ) {
    this.aiToolsService = new AiToolsService(configService, prisma)
  }

  async findAll(page: number, perPage: number) : Promise<DocumentsResponse>{
    // using raw sql inorder to get embeddings.
    const documents:DocumentWithEmbedding[]  = await this.prisma.$queryRaw`
      SELECT id,"chunkId", content, heading, summary, tags, CAST("contentEmbedding" AS TEXT), CAST("headingEmbedding" AS TEXT), CAST("summaryEmbedding" AS TEXT)
      FROM document
      ORDER BY id
      OFFSET ${(page - 1) * perPage} 
      LIMIT ${perPage}
    `;
    const totalDocuments = await this.prisma.document.count();
    const totalPages = Math.ceil(totalDocuments / perPage);
    const pagination = { page, perPage, totalPages, totalDocuments };
    return { pagination, documents };
  }

  async createOrUpdate(allData: CreateDocumentDto[]): Promise<Document[]> {
    const response: Document[] = [];
    if (Array.isArray(allData)) {
      for (const data of allData) {
        data.chunkId = parseInt(`${data.chunkId}`)
        let olderDocument;
        let document: Document;
        try {
          olderDocument = await this.prisma.document.findUnique({
            where: {
              chunkId: data.chunkId,
            },
          });
          if (olderDocument) {

            this.promptHistoryService.softDeleteRelatedToDocument(olderDocument.id)

            if (data.content && (olderDocument.content != data.content)) {
              olderDocument.content = data.content;
              document = await this.prisma.document.update({
                where: { chunkId: data.chunkId },
                data: { content: data.content },
              });
              let embedding = (await this.aiToolsService.getEmbedding(data.content,"retrieval"))[0];
              await this.prisma.$queryRawUnsafe(
                `UPDATE document SET "contentEmbedding" = '[${embedding
                  .map((x) => `${x}`)
                  .join(",")}]' WHERE "chunkId" = ${data.chunkId}`
              );
            }

            if (data.heading && (olderDocument.heading != data.heading)) {
              olderDocument.heading = data.heading;
              document = await this.prisma.document.update({
                where: { chunkId: data.chunkId },
                data: { heading: data.heading },
              });
              let embedding = (await this.aiToolsService.getEmbedding(data.heading,"retrieval"))[0];
              await this.prisma.$queryRawUnsafe(
                `UPDATE document SET "headingEmbedding" = '[${embedding
                  .map((x) => `${x}`)
                  .join(",")}]' WHERE "chunkId" = ${data.chunkId}`
              );
            }

            if (data.summary && (olderDocument.summary != data.summary)) {
              olderDocument.summary = data.summary;
              document = await this.prisma.document.update({
                where: { chunkId: data.chunkId },
                data: { summary: data.summary },
              });
              let embedding = (await this.aiToolsService.getEmbedding(data.summary,"retrieval"))[0];
              await this.prisma.$queryRawUnsafe(
                `UPDATE document SET "summaryEmbedding" = '[${embedding
                  .map((x) => `${x}`)
                  .join(",")}]' WHERE "chunkId" = ${data.chunkId}`
              );
            }

            if(data.startPage) {
              document = await this.prisma.document.update({
                where: { chunkId: data.chunkId },
                data: { metaData: {
                  startPage: data.startPage,
                  endPage: document.metaData['endPage']
                }},
              });
            }

            if(data.endPage) {
              document = await this.prisma.document.update({
                where: { chunkId: data.chunkId },
                data: { metaData: {
                  startPage: document.metaData['startPage'],
                  endPage: data.endPage
                }},
              });
            }

            if(data.type) {
              document = await this.prisma.document.update({
                where: { chunkId: data.chunkId },
                data: { type: data.type },
              });
            }

          } else {
            if(!data.summary || !data.heading || !data.content ) throw new Error("Invalid request body.")
            let contentEmbedding = (await this.aiToolsService.getEmbedding(data.content,"retrieval"))[0];
            let headingEmbedding = (await this.aiToolsService.getEmbedding(data.heading,"retrieval"))[0];
            let summaryEmbedding = (await this.aiToolsService.getEmbedding(data.summary,"retrieval"))[0];
            document = await this.prisma.document.create({
              data: {
                chunkId: data.chunkId,
                tags: data.tags,
                content: data.content,
                heading: data.heading,
                summary: data.summary,
                metaData: {
                  startPage: data.startPage,
                  endPage: data.endPage
                },
                type: data.type
              },
            });
            await this.prisma.$queryRawUnsafe(
              `UPDATE document SET 
                "contentEmbedding" = '[${contentEmbedding.map((x) => `${x}`).join(",")}]',
                "headingEmbedding" = '[${headingEmbedding.map((x) => `${x}`).join(",")}]',
                "summaryEmbedding" = '[${summaryEmbedding.map((x) => `${x}`).join(",")}]'
                WHERE "chunkId" = ${data.chunkId}`
            );
          }
          response.push(document);
        } catch (error) {
          throw new BadRequestException(error);
        }
      }
    }
    return response;
  }

  async findByCriteria(searchQueryDto: SearchQueryDto, searchVia: string = 'summaryEmbedding', type = ""): Promise<any> {
    const embedding: any = (
      await this.aiToolsService.getEmbedding(searchQueryDto.query)
    )[0];
    let query_embedding = `[${embedding
      .map((x) => `${x}`)
      .join(",")}]`
    let similarity_threshold = searchQueryDto.similarityThreshold
    let match_count = searchQueryDto.matchCount

    const results = await this.prisma
    .$queryRawUnsafe(`
      SELECT
      document.id as id,
      CONCAT('Heading: ', document.heading, E'\n', 'Content: ', document.content) AS content,
      document.tags as tags,
      1 - (document."${searchVia}" <=> '${query_embedding}') as similarity,
      document."metaData" as "metaData",
      document."chunkId" as "chunkId",
      document.type as type
      FROM
        document
      WHERE 
        1 - (document."${searchVia}" <=> '${query_embedding}') > ${similarity_threshold}
        ${type? `AND document.type = '${type}'`:''}
      ORDER BY
        document."${searchVia}" <=> '${query_embedding}'
      LIMIT ${match_count};`
    );

    return results;
  }

  async findByCriteria2(searchQueryDto: SearchQueryDto, searchVia: string = 'summaryEmbedding', type = ""): Promise<any> {
    const embedding: any = (
      await this.aiToolsService.getEmbedding(searchQueryDto.query)
    )[0];
    let query_embedding = `[${embedding
      .map((x) => `${x}`)
      .join(",")}]`
    let similarity_threshold = searchQueryDto.similarityThreshold
    let match_count = searchQueryDto.matchCount

    const results = await this.prisma
    .$queryRawUnsafe(`
      SELECT
      document.id as id,
      document.content AS content,
      document.heading AS heading,
      document.summary AS summary,
      document.tags as tags,
      1 - (document."${searchVia}" <=> '${query_embedding}') as similarity,
      document."metaData" as "metaData",
      document."chunkId" as "chunkId",
      document.type as type
      FROM
        document
      WHERE 
        1 - (document."${searchVia}" <=> '${query_embedding}') > ${similarity_threshold}
        ${type? `AND document.type = '${type}'`:''}
      ORDER BY
        document."${searchVia}" <=> '${query_embedding}'
      LIMIT ${match_count};`
    );

    return results;
  }

  async findOne(id: number): Promise<DocumentWithEmbedding | null> {
    try {
      const document:DocumentWithEmbedding[]  = await this.prisma.$queryRaw`
      SELECT "chunkId", id, content, heading, summary, tags, CAST("contentEmbedding" AS TEXT), CAST("headingEmbedding" AS TEXT), CAST("summaryEmbedding" AS TEXT)
      FROM document where id = ${parseInt(`${id}`)}
    `;
      return document[0];
    } catch {
      return null;
    }
  }

  async findOneByChunkId(id: number): Promise<DocumentWithEmbedding | null> {
    try {
      const document:DocumentWithEmbedding[]  = await this.prisma.$queryRaw`
      SELECT "chunkId", id, content, heading, summary, tags, CAST("contentEmbedding" AS TEXT), CAST("headingEmbedding" AS TEXT), CAST("summaryEmbedding" AS TEXT)
      FROM document where "chunkId" = ${parseInt(`${id}`)}
    `;
      return document[0];
    } catch {
      return null;
    }
  }

  async update(data: CreateDocumentDto): Promise<Document> {
    const document = await this.createOrUpdate([data]);
    return data[0];
  }

  async remove(id: number): Promise<Document> {
    return this.prisma.document.delete({
      where: { id: parseInt(`${id}`) },
    });
  }

  async getWithFilters(getDocumentsDto: GetDocumentsDto): Promise<any> {
    const searchVia = getDocumentsDto.filter.searchVia || 'contentEmbedding'
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
      document.id as id,
      1 - (document."${searchVia}" <=> '${query_embedding}') as similarity
      FROM
        document
      WHERE 
        1 - (document."${searchVia}" <=> '${query_embedding}') > ${similarity_threshold}
      ORDER BY
        document."${searchVia}" <=> '${query_embedding}'
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
            'id', doc.id,
            'content', doc.content,
            'heading', doc.heading,
            'summary', doc.summary,
            'tags', doc.tags,
            'contentEmbedding', CAST(doc."contentEmbedding" AS TEXT),
            'headingEmbedding', CAST(doc."headingEmbedding" AS TEXT),
            'summaryEmbedding', CAST(doc."summaryEmbedding" AS TEXT),
            'similarity', matched_docs.similarity,
            'chunkId', doc."chunkId"
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
}
