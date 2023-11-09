import {
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  IsPhoneNumber,
  IsDefined,
  ValidateIf,
  IsUUID,
  IsOptional,
} from "class-validator";

export class CreatePromptDto {
  id: string;

  @IsDefined({ message: "Query cannot be empty" })
  queryInEnglish: string;

  @IsDefined({ message: "LLM response cannot be empty" })
  responseInEnglish: string;

  @IsDefined({ message: "Response time cannot be empty" })
  responseTime: number;

  metadata: any;

  @IsDefined({ message: "QueryId id cannot be empty" })
  queryId: string

  pdfId: string;
}

export class SearchPromptHistoryDto {
  @IsOptional()
  exactQuery?: string;

  @IsDefined({ message: "Query needs to be defined to search documents" })
  query: string;

  @IsDefined({ message: "Similarity Threashold needs to be defined" })
  similarityThreshold: number;

  @IsDefined({
    message: "Max matched documents need to be difined to limit search results",
  })
  matchCount: number;
}

class Pagination {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  perPage?: number;
}

export class GetPromptHistoryDto {
  @IsOptional()
  pagination?: Pagination

  @IsOptional()
  filter?: SearchPromptHistoryDto
}

export class PromptHistory {
  createdAt: String;   
  updatedAt: String; 
  id: Number;
  queryId:String;        
  responseTime: Number;
  queryInEnglish: String;
  responseInEnglish: String;
}

export interface PromptHistoryResponse {
    history: PromptHistory[];
    pagination: {
      page: number;
      totalPages: number;
    }
}