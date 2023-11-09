import { Body, Controller, Post, Get, HttpException, HttpStatus, Param, Delete, NotFoundException } from "@nestjs/common";
import { PromptHistoryService } from "./prompt-history.service";
import { document as Document, Prisma } from "@prisma/client";
import { GetPromptHistoryDto, PromptHistoryResponse, SearchPromptHistoryDto } from "./prompt.dto";

@Controller("history")
export class PromptHistoryController {
  constructor(private readonly promptHistoryService: PromptHistoryService) {}

  @Post("find")
  async findAll(
    @Body() getDocumentsDto: GetPromptHistoryDto
  ): Promise<PromptHistoryResponse> {
    try {
      if(getDocumentsDto.filter.exactQuery){
        const history = await this.promptHistoryService.findOneByExactQuery(getDocumentsDto.filter.exactQuery);
        return {
          history: [history],
          pagination: {
            page: 1,
            totalPages: 1
          }
        }
      }
      if(
        getDocumentsDto.filter &&
        getDocumentsDto.filter.query &&
        getDocumentsDto.filter.similarityThreshold &&
        getDocumentsDto.filter.matchCount
      ) {
        const documents = await this.promptHistoryService.getWithFilters(getDocumentsDto);
        return documents
      } else {
        const page = getDocumentsDto.pagination.page || 1;
        const perPage = getDocumentsDto.pagination.perPage || 10;
        const documents = await this.promptHistoryService.findAll(page,perPage);
        return documents;
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  @Post("/searchSimilar")
  async findByCriteria(
    @Body() searchQueryDto: SearchPromptHistoryDto
  ): Promise<Document[]> {
    return this.promptHistoryService.findByCriteria(searchQueryDto);
  }
}
