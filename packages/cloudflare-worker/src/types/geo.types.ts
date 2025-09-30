/**
 * GEO Analysis Types
 * Core data structures for Generative Engine Optimization
 */

import { JinaContent, JinaSearchResult } from './jina.types';

export interface GeoScores {
  overall: number;
  extractability: number;
  readability: number;
  citability: number;
}

export interface SentenceLengthMetrics {
  average: number;
  target: number;
  problematic: Array<{
    sentence: string;
    wordCount: number;
    location: string;
  }>;
}

export interface ClaimDensityMetrics {
  current: number;
  target: number;
  weakSections: Array<{
    section: string;
    claims: number;
    wordCount: number;
    density: number;
  }>;
}

export interface DateMarkerMetrics {
  found: number;
  recommended: number;
  missingContexts: Array<{
    claim: string;
    location: string;
    needsDate: boolean;
  }>;
}

export interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export interface SemanticTripleMetrics {
  total: number;
  density: number;
  quality: number;
  examples: Array<{
    sentence: string;
    triples: SemanticTriple[];
  }>;
}

export interface EntityMetrics {
  total: number;
  density: number;
  diversity: number;
  genericReferences: Array<{
    text: string;
    location: string;
    suggestedReplacement: string;
  }>;
}

export interface QueryAlignmentMetrics {
  primaryQuery: string;
  latentIntents: Array<{
    intent: string;
    type: 'comparative' | 'evaluative' | 'temporal' | 'decisional' | 'informational';
    coverage: number;
    gaps: string[];
  }>;
  headingAlignment: Array<{
    heading: string;
    queryRelevance: number;
    suggestedRephrase?: string;
  }>;
}

export interface StructureMetrics {
  headingCount: number;
  listCount: number;
  avgSectionLength: number;
  hasTableOfContents: boolean;
}
