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
    this.aiToolsService = new AiToolsService(configService)
  }

  async findAll(page: number, perPage: number) : Promise<DocumentsResponse>{
    // using raw sql inorder to get embeddings.
    const documents:DocumentWithEmbedding[]  = await this.prisma.$queryRaw`
      SELECT id, content, tags, CAST(embedding AS TEXT)
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
        let olderDocument;
        let document: Document;
        try {
          olderDocument = await this.prisma.document.findUnique({
            where: {
              id: data.id,
            },
          });
          if (olderDocument) {
            this.promptHistoryService.softDeleteRelatedToDocument(data.id)
            if (olderDocument.tags == data.tags) {
              olderDocument.content = data.content;
              document = await this.prisma.document.update({
                where: { id: data.id },
                data: { content: data.content },
              });
            } else {
              // get new embeddings for newer tags
              // get new embeddings for newer tags if they have changed
              let embedding = (await this.aiToolsService.getEmbedding(data.tags))[0];
              document = await this.prisma.document.update({
                where: { id: data.id },
                data: {
                  tags: data.tags,
                  content: data.content,
                },
              });
              await this.prisma.$queryRawUnsafe(
                `UPDATE document SET embedding = '[${embedding
                  .map((x) => `${x}`)
                  .join(",")}]' WHERE id = ${document.id}`
              );
            }
          } else {
            let embedding = (await this.aiToolsService.getEmbedding(data.tags))[0];
            document = await this.prisma.document.create({
              data: {
                id: data.id,
                tags: data.tags,
                content: data.content,
              },
            });
            await this.prisma.$queryRawUnsafe(
              `UPDATE document SET embedding = '[${embedding
                .map((x) => `${x}`)
                .join(",")}]' WHERE id = ${document.id}`
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

  async findByCriteria(searchQueryDto: SearchQueryDto): Promise<any> {
    const embedding: any = (
      await this.aiToolsService.getEmbedding(searchQueryDto.query)
    )[0];
    const results = await this.prisma
      .$queryRawUnsafe(`SELECT * FROM match_documents(
        query_embedding := '[${embedding
          .map((x) => `${x}`)
          .join(",")}]',
        pdfId := '${searchQueryDto.pdfId}',
        similarity_threshold := ${searchQueryDto.similarityThreshold},
        match_count := ${searchQueryDto.matchCount}
      );`);


    return results;
  }

  async findOne(id: number): Promise<DocumentWithEmbedding | null> {
    try {
      const document:DocumentWithEmbedding[]  = await this.prisma.$queryRaw`
      SELECT id, content, tags, CAST(embedding AS TEXT)
      FROM document where id = ${parseInt(`${id}`)}
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
    const page = getDocumentsDto.pagination.page || 1;
    const perPage = getDocumentsDto.pagination.perPage || 10;
    const embedding: any = (
      await this.aiToolsService.getEmbedding(getDocumentsDto.filter.query)
    )[0];
    let result = await this.prisma
    .$queryRawUnsafe(`
    WITH matched_docs AS (
      SELECT id, similarity
      FROM match_documents(
        query_embedding := '[${embedding.map((x) => `${x}`).join(",")}]',
        similarity_threshold := ${getDocumentsDto.filter.similarityThreshold},
        match_count := ${getDocumentsDto.filter.matchCount}
      )
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
            'tags', doc.tags,
            'embedding', CAST(doc.embedding AS TEXT),
            'similarity', matched_docs.similarity
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
