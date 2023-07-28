
export class DocumentWithEmbedding {
  createdAt: string;
  updatedAt: string;
  id: number;
  content: string;
  tags: string;
  embedding: string;
  similarity?: string;
}

export interface DocumentsResponse {
    documents: DocumentWithEmbedding[];
    pagination: {
      page: number;
      totalPages: number;
    }
}