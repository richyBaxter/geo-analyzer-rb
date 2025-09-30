/**
 * Jina AI API Types
 * Based on official Jina API documentation
 */

export interface JinaContent {
  title: string;
  url: string;
  content: string;
  description?: string;
  publishedTime?: string;
  usage?: {
    tokens: number;
  };
}

export interface JinaReaderResponse {
  code: number;
  status: number;
  data: JinaContent;
}

export interface JinaSearchResponse {
  code: number;
  status: number;
  data: JinaContent[];
}

export interface JinaSearchResult {
  query: string;
  results: JinaContent[];
  retrievedAt: string;
}

export interface JinaReaderOptions {
  withImageCaptions?: boolean;
  withLinksSummary?: boolean;
  withImagesSummary?: boolean;
  targetSelector?: string;
  timeout?: number;
  useReaderLM?: boolean;
  returnFormat?: 'json' | 'markdown';
}

export interface JinaSearchOptions {
  sites?: string[];
  returnFormat?: 'json' | 'markdown';
}

export class JinaError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public url: string
  ) {
    super(message);
    this.name = 'JinaError';
  }
}
