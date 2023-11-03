import {
  IsInt,
  Min,
  IsDefined,
  IsOptional
} from "class-validator";

export class CreateDocumentDto {
  @IsDefined({ message: "Unique ID is required to ingest embeddings" })
  id: number;

  @IsDefined({ message: "Tags cannot be empty" })
  tags: string;

  content: string;
}

export class SearchQueryDto {
  @IsDefined({ message: "Query needs to be defined to search documents" })
  query: string;

  @IsDefined({ message: "Similarity Threashold needs to be defined" })
  similarityThreshold: number;

  @IsDefined({
    message: "Max matched documents need to be defined to limit search results",
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

export class GetDocumentsDto {
  @IsOptional()
  pagination?: Pagination 

  @IsOptional()
  filter?: SearchQueryDto
}
