import {
  IsInt,
  IsNotEmpty,
  Max,
  Min,
  IsPhoneNumber,
  IsDefined,
  ValidateIf,
  IsUUID,
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
  @IsDefined({ message: "Query needs to be defined to search documents" })
  query: string;

  @IsDefined({ message: "Similarity Threashold needs to be defined" })
  similarityThreshold: number;

  @IsDefined({
    message: "Max matched documents need to be difined to limit search results",
  })
  matchCount: number;
}
