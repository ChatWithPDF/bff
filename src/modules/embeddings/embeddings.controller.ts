import { Body, Controller, Post, Get, HttpException, HttpStatus, Param, Delete, NotFoundException } from "@nestjs/common";
import { CreateDocumentDto, GetDocumentsDto, SearchQueryDto } from "./embeddings.dto";
import { EmbeddingsService } from "./embeddings.service";
import { document as Document, Prisma } from "@prisma/client";
import { DocumentsResponse, DocumentWithEmbedding } from "./embeddings.model";

@Controller("document")
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post("find")
  async findAll(
    @Body() getDocumentsDto: GetDocumentsDto
  ): Promise<DocumentsResponse> {
    try {
      if(
        getDocumentsDto.filter &&
        getDocumentsDto.filter.query &&
        getDocumentsDto.filter.similarityThreshold &&
        getDocumentsDto.filter.matchCount
      ) {
        const documents = await this.embeddingsService.getWithFilters(getDocumentsDto);
        return documents
      } else {
        const page = getDocumentsDto.pagination.page || 1;
        const perPage = getDocumentsDto.pagination.perPage || 10;
        const documents = await this.embeddingsService.findAll(page,perPage);
        return documents;
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number
  ) : Promise<DocumentWithEmbedding>{
    try {
      const document = await this.embeddingsService.findOne(id);
      return document;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // @Post()
  // async createOrUpdate(
  //   @Body() createFeedbackDto: CreateDocumentDto | CreateDocumentDto[]
  // ): Promise<Document[]> {
  //   if (!Array.isArray(createFeedbackDto)) {
  //     createFeedbackDto = [createFeedbackDto];
  //   }
  //   return this.embeddingsService.createOrUpdate(createFeedbackDto);
  // }

  @Post("/searchSimilar")
  async findByCriteria(
    @Body() searchQueryDto: SearchQueryDto
  ): Promise<Document[]> {
    return this.embeddingsService.findByCriteria2(searchQueryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    try {
      const deletedDocument = await this.embeddingsService.remove(id);
      if (!deletedDocument) {
        throw new NotFoundException(`Document with id ${id} not found`);
      }
      return { document: deletedDocument };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Document with id ${id} not found`);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
