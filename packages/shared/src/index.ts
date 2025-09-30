// Import and re-export base types first
import type {
  JinaContent,
  JinaSearchResult,
} from './jina.types';

import type {
  GeoScores,
  SentenceLengthMetrics,
  ClaimDensityMetrics,
  DateMarkerMetrics,
  StructureMetrics,
  SemanticTripleMetrics,
  EntityMetrics,
  QueryAlignmentMetrics,
} from './geo.types';

export * from './jina.types';
export * from './geo.types';

// Then export interfaces that depend on them
export interface ContentChunk {
  content: string;
  semanticCoherence: number;
  selfContained: boolean;
  missingContext: string[];
  tokenCount: number;
}

export interface GeoRecommendation {
  method: string;
  priority: 'high' | 'medium' | 'low';
  location: string;
  currentText: string;
  suggestedText: string;
  rationale: string;
}

export interface CompetitorAnalysis {
  source: JinaContent;
  score: number;
  strengths: string[];
}

export interface ContentGap {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  examples: string[];
}

export interface GeoAnalysis {
  analyzedAt: string;
  version: string;
  targetQuery: string;
  scores: GeoScores;
  metrics: {
    sentenceLength: SentenceLengthMetrics;
    claimDensity: ClaimDensityMetrics;
    dateMarkers: DateMarkerMetrics;
    structure: StructureMetrics;
    semanticTriples: SemanticTripleMetrics;
    entities: EntityMetrics;
    queryAlignment: QueryAlignmentMetrics;
  };
  chunking: {
    chunks: ContentChunk[];
    averageCoherence: number;
    problematicBoundaries: number;
  };
  recommendations: GeoRecommendation[];
}

export interface GeoAnalysisResult {
  source: JinaContent;
  analysis: GeoAnalysis;
  comparison?: {
    competitors: CompetitorAnalysis[];
    gaps: ContentGap[];
  };
  claudePrompt?: string;
}

export interface GeoApiResponse {
  request: {
    url: string;
    query: string;
    competitorUrls?: string[];
    analyzedAt: string;
  };
  jinaContent: JinaContent;
  geoAnalysis: GeoAnalysis;
  competitors?: {
    jinaResults: JinaSearchResult;
    analyses: CompetitorAnalysis[];
  };
  usage: {
    neuronsUsed: number;
    jinaTokensUsed: number;
    dailyRemaining: number;
    cacheHit: boolean;
  };
  meta: {
    version: string;
    processingTime: number;
    featuresUsed: string[];
  };
}
