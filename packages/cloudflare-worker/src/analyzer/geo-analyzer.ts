import { JinaClient } from '../jina/client';
import { JinaContent, JinaSearchResult } from '../types/jina.types';
import {
  GeoAnalysis,
  CompetitorAnalysis,
} from '../types/geo.types';
import { PatternAnalyzer } from './pattern-analyzer';
import { LLMAnalyzer, LLMAnalysisResult } from './llm-analyzer';

interface AnalyzeOptions {
  competitorUrls?: string[];
  autoDiscoverCompetitors?: boolean;
  aiModel?: string;
}

interface GeoApiResponsePartial {
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

export class GeoAnalyzer {
  private ai: Ai;
  private jinaClient: JinaClient;
  private patternAnalyzer: PatternAnalyzer;

  constructor(ai: Ai, jinaClient: JinaClient) {
    this.ai = ai;
    this.jinaClient = jinaClient;
    this.patternAnalyzer = new PatternAnalyzer();
  }

  async analyze(
    url: string,
    targetQuery: string,
    options: AnalyzeOptions = {}
  ): Promise<Omit<GeoApiResponsePartial, 'meta'>> {
    const jinaContent = await this.jinaClient.read(url, {
      withImageCaptions: true,
      withLinksSummary: true,
      returnFormat: 'json',
      useReaderLM: true,
    });

    let llmAnalysis: LLMAnalysisResult | undefined;
    let llmError: string | undefined;
    try {
      const llmAnalyzer = new LLMAnalyzer(this.ai, options.aiModel);
      llmAnalysis = await llmAnalyzer.analyzeSemantics(
        jinaContent.content,
        targetQuery
      );
    } catch (error) {
      llmError = error instanceof Error ? error.message : 'Unknown LLM error';
      llmAnalysis = undefined;
    }

    let competitors: JinaSearchResult | undefined;
    if (options.autoDiscoverCompetitors) {
      const competitorResults = await this.jinaClient.search(targetQuery, {
        returnFormat: 'json',
      });
      competitors = {
        query: targetQuery,
        results: competitorResults,
        retrievedAt: new Date().toISOString(),
      };
    } else if (options.competitorUrls) {
      const competitorContents = await this.jinaClient.readBatch(
        options.competitorUrls,
        { returnFormat: 'json' }
      );
      competitors = {
        query: targetQuery,
        results: competitorContents,
        retrievedAt: new Date().toISOString(),
      };
    }

    const patternAnalysis = this.patternAnalyzer.analyze(jinaContent.content, targetQuery);
    
    const geoAnalysis = this.enhanceWithLLM(patternAnalysis, llmAnalysis);

    return {
      request: {
        url,
        query: targetQuery,
        competitorUrls: options.competitorUrls,
        analyzedAt: new Date().toISOString(),
      },
      jinaContent,
      geoAnalysis,
      competitors: competitors
        ? {
            jinaResults: competitors,
            analyses: await this.analyzeCompetitors(competitors.results),
          }
        : undefined,
      usage: {
        neuronsUsed: llmAnalysis ? 50 : 0,
        jinaTokensUsed: jinaContent.usage?.tokens || 0,
        dailyRemaining: 10000 - (llmAnalysis ? 50 : 0),
        cacheHit: false,
      },
      meta: {
        version: '1.0.0',
        processingTime: 0,
        featuresUsed: [
          'pattern-analysis',
          ...(llmAnalysis ? ['llm-semantic-analysis'] : []),
          ...(llmError ? [`llm-error: ${llmError}`] : []),
        ],
      },
    };
  }

  async analyzeText(
    content: string,
    targetQuery: string,
    options: { title?: string; url?: string; aiModel?: string } = {}
  ): Promise<Omit<GeoApiResponsePartial, 'meta'>> {
    const jinaContent: JinaContent = {
      title: options.title || 'Optimized Content',
      url: options.url || 'text://optimized-content',
      content,
      usage: {
        tokens: 0,
      },
    };

    let llmAnalysis: LLMAnalysisResult | undefined;
    let llmError: string | undefined;
    try {
      const llmAnalyzer = new LLMAnalyzer(this.ai, options.aiModel);
      llmAnalysis = await llmAnalyzer.analyzeSemantics(
        content,
        targetQuery
      );
    } catch (error) {
      llmError = error instanceof Error ? error.message : 'Unknown LLM error';
      llmAnalysis = undefined;
    }

    const patternAnalysis = this.patternAnalyzer.analyze(content, targetQuery);
    
    const geoAnalysis = this.enhanceWithLLM(patternAnalysis, llmAnalysis);

    return {
      request: {
        url: jinaContent.url,
        query: targetQuery,
        analyzedAt: new Date().toISOString(),
      },
      jinaContent,
      geoAnalysis,
      usage: {
        neuronsUsed: llmAnalysis ? 50 : 0,
        jinaTokensUsed: 0,
        dailyRemaining: 10000 - (llmAnalysis ? 50 : 0),
        cacheHit: false,
      },
      meta: {
        version: '1.0.0',
        processingTime: 0,
        featuresUsed: [
          'pattern-analysis',
          'text-input',
          ...(llmAnalysis ? ['llm-semantic-analysis'] : []),
          ...(llmError ? [`llm-error: ${llmError}`] : []),
        ],
      },
    };
  }

  private enhanceWithLLM(
    patternAnalysis: any,
    llmAnalysis?: LLMAnalysisResult
  ): GeoAnalysis {
    if (!llmAnalysis) {
      return {
        ...patternAnalysis,
        analyzedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    }

    const enhancedMetrics = {
      ...patternAnalysis.metrics,
      semanticTriples: {
        total: llmAnalysis.semanticTriples.length,
        density: llmAnalysis.semanticTriples.length,
        quality: this.calculateAvgConfidence(llmAnalysis.semanticTriples),
        examples: llmAnalysis.semanticTriples.slice(0, 3).map(t => ({
          subject: t.subject,
          predicate: t.predicate,
          object: t.object,
          confidence: t.confidence,
        })),
      },
      entities: {
        total: llmAnalysis.advancedEntities.length,
        density: llmAnalysis.advancedEntities.length,
        diversity: this.countEntityTypes(llmAnalysis.advancedEntities),
        genericReferences: [],
      },
    };

    const enhancedChunking = {
      ...patternAnalysis.chunking,
      averageCoherence: llmAnalysis.chunkCoherence.coherent ? 0.9 : 0.7,
      problematicBoundaries: llmAnalysis.chunkCoherence.missingContext.length,
    };

    const tripleScore = Math.min(10, llmAnalysis.semanticTriples.length * 2);
    const entityScore = Math.min(10, llmAnalysis.advancedEntities.length / 2);
    const citabilityScore = (tripleScore + entityScore) / 2;

    const enhancedScores = {
      ...patternAnalysis.scores,
      citability: Math.round(citabilityScore * 10) / 10,
      overall: Math.round(
        ((patternAnalysis.scores.extractability + 
          patternAnalysis.scores.readability + 
          citabilityScore) / 3) * 10
      ) / 10,
    };

    return {
      analyzedAt: new Date().toISOString(),
      version: '1.0.0',
      targetQuery: patternAnalysis.metrics.queryAlignment.primaryQuery,
      scores: enhancedScores,
      metrics: enhancedMetrics,
      chunking: enhancedChunking,
      recommendations: patternAnalysis.recommendations,
    };
  }

  private calculateAvgConfidence(triples: any[]): number {
    if (triples.length === 0) return 0;
    const sum = triples.reduce((acc, t) => acc + t.confidence, 0);
    return Math.round((sum / triples.length) * 100) / 100;
  }

  private countEntityTypes(entities: any[]): number {
    const types = new Set(entities.map(e => e.type));
    return types.size;
  }

  private async analyzeCompetitors(
    competitorContents: JinaContent[]
  ): Promise<CompetitorAnalysis[]> {
    return competitorContents.map((content) => {
      const words = content.content.split(/\s+/).filter(w => w.length > 0);
      const sentences = content.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const headingPattern = /^#{1,6}\s+.+$/gm;
      const headings = content.content.match(headingPattern) || [];
      
      return {
        url: content.url,
        title: content.title,
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
        headingCount: headings.length,
      };
    });
  }
}
