import { Body, Controller, Post, Get, HttpException, HttpStatus, Param, Delete, NotFoundException } from "@nestjs/common";
import { PromptHistoryService } from "./prompt-history.service";
import { document as Document, Prisma } from "@prisma/client";
import { SearchPromptHistoryDto } from "./prompt.dto";

@Controller("history")
export class PromptHistoryController {
  constructor(private readonly promptHistoryService: PromptHistoryService) {}
  @Post("/searchSimilar")
  async findByCriteria(
    @Body() searchQueryDto: SearchPromptHistoryDto
  ): Promise<Document[]> {
    return this.promptHistoryService.findByCriteria(searchQueryDto);
  }
}
