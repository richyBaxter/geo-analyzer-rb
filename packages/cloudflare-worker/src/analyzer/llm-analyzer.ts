import { Ai } from '@cloudflare/workers-types';

interface SemanticTriple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

interface AdvancedEntity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PRODUCT' | 'TECHNOLOGY' | 'METRIC';
  context: string;
  importance: number;
}

interface ChunkCoherence {
  coherent: boolean;
  missingContext: string[];
  selfContained: boolean;
}

export interface LLMAnalysisResult {
  semanticTriples: SemanticTriple[];
  advancedEntities: AdvancedEntity[];
  chunkCoherence: ChunkCoherence;
  topicalRelevance: number;
}

export class LLMAnalyzer {
  private ai: Ai;
  private model: string;

  constructor(ai: Ai, model?: string) {
    this.ai = ai;
    this.model = model || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  }

  async analyzeSemantics(
    content: string,
    targetQuery: string
  ): Promise<LLMAnalysisResult> {
    const truncatedContent = this.truncateContent(content, 2000);
    
    const prompt = this.buildUnifiedPrompt(truncatedContent, targetQuery);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseResponse(response, content, targetQuery);
    } catch (error) {
      throw error;
    }
  }

  private truncateContent(content: string, maxChars: number): string {
    if (content.length <= maxChars) {
      return content;
    }
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let truncated = '';
    
    for (const sentence of sentences) {
      if ((truncated + sentence).length > maxChars) {
        break;
      }
      truncated += sentence + '. ';
    }
    
    return truncated.trim();
  }

  private buildUnifiedPrompt(content: string, query: string): string {
    return `You are a semantic analysis expert for AI search optimization.

Analyze this content for the query: "${query}"

Content:
${content}

CRITICAL: You MUST return ONLY a valid JSON object with this EXACT structure:

{
  "semanticTriples": [
    {"subject": "string", "predicate": "string", "object": "string", "confidence": 0.9}
  ],
  "entities": [
    {"text": "string", "type": "PERSON|ORGANIZATION|LOCATION|PRODUCT|TECHNOLOGY|METRIC", "context": "string", "importance": 0.8}
  ],
  "coherence": {
    "coherent": true,
    "missingContext": ["list of missing context"],
    "selfContained": true
  },
  "relevance": 0.85
}

Rules:
1. Extract 3-5 factual semantic triples (subject-predicate-object) related to "${query}"
2. Identify 5-10 key entities with importance scores (0-1)
3. Assess if content makes sense without external context
4. Rate topical relevance to query (0-1)
5. Return ONLY the JSON object above - NO other text, NO markdown, NO explanations

Begin your response with { and end with }`;
  }

  private async callLLM(prompt: string): Promise<string> {
    try {
      const response = await this.ai.run(this.model, {
        messages: [
          {
            role: 'system',
            content: 'You are a semantic analysis expert. Return only valid JSON, no markdown formatting or additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      });

      let rawResponse = (response as any).response;
      
      if (!rawResponse) {
        throw new Error('LLM returned no response field');
      }
      
      if (typeof rawResponse !== 'string') {
        rawResponse = JSON.stringify(rawResponse);
      }
      
      const stringResponse = String(rawResponse);
      
      if (!stringResponse || stringResponse.trim().length === 0) {
        throw new Error('LLM returned empty response');
      }
      
      return stringResponse;
    } catch (error) {
      throw new Error(`LLM call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseResponse(response: string, originalContent: string, query: string): LLMAnalysisResult {
    try {
      let cleaned = response.trim();
      
      if (!cleaned) {
        throw new Error('Empty response after trim');
      }
      
      cleaned = cleaned.replace(/```json\n?/g, '');
      cleaned = cleaned.replace(/```\n?/g, '');
      cleaned = cleaned.replace(/`/g, '');
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.semanticTriples && !parsed.entities) {
        throw new Error('Invalid JSON structure');
      }
      
      return {
        semanticTriples: this.validateTriples(parsed.semanticTriples || []),
        advancedEntities: this.validateEntities(parsed.entities || []),
        chunkCoherence: this.validateCoherence(parsed.coherence || {}),
        topicalRelevance: this.validateRelevance(parsed.relevance),
      };
    } catch (error) {
      return this.createFallbackResult(originalContent, query);
    }
  }

  private validateTriples(triples: any[]): SemanticTriple[] {
    if (!Array.isArray(triples)) return [];
    
    return triples
      .filter(t => t.subject && t.predicate && t.object)
      .map(t => ({
        subject: String(t.subject),
        predicate: String(t.predicate),
        object: String(t.object),
        confidence: typeof t.confidence === 'number' ? Math.min(1, Math.max(0, t.confidence)) : 0.7,
      }))
      .slice(0, 10);
  }

  private validateEntities(entities: any[]): AdvancedEntity[] {
    if (!Array.isArray(entities)) return [];
    
    const validTypes = ['PERSON', 'ORGANIZATION', 'LOCATION', 'PRODUCT', 'TECHNOLOGY', 'METRIC'];
    
    return entities
      .filter(e => e.text && validTypes.includes(e.type))
      .map(e => ({
        text: String(e.text),
        type: e.type as AdvancedEntity['type'],
        context: String(e.context || ''),
        importance: typeof e.importance === 'number' ? Math.min(1, Math.max(0, e.importance)) : 0.5,
      }))
      .slice(0, 15);
  }

  private validateCoherence(coherence: any): ChunkCoherence {
    if (!coherence || typeof coherence !== 'object') {
      return {
        coherent: true,
        missingContext: [],
        selfContained: true,
      };
    }
    
    return {
      coherent: coherence.coherent !== false,
      missingContext: Array.isArray(coherence.missingContext) 
        ? coherence.missingContext.slice(0, 5) 
        : [],
      selfContained: coherence.selfContained !== false,
    };
  }

  private validateRelevance(relevance: any): number {
    if (typeof relevance === 'number') {
      return Math.min(1, Math.max(0, relevance));
    }
    return 0.5;
  }

  private createFallbackResult(content: string, query: string): LLMAnalysisResult {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    const matches = queryTerms.filter(term => contentLower.includes(term));
    const relevance = Math.min(1.0, matches.length / queryTerms.length);
    
    return {
      semanticTriples: [],
      advancedEntities: [],
      chunkCoherence: {
        coherent: true,
        missingContext: ['LLM analysis failed - using fallback'],
        selfContained: true,
      },
      topicalRelevance: relevance,
    };
  }

  calculateAvgConfidence(triples: SemanticTriple[]): number {
    if (triples.length === 0) return 0;
    const sum = triples.reduce((acc, t) => acc + t.confidence, 0);
    return Math.round((sum / triples.length) * 100) / 100;
  }

  calculateAvgImportance(entities: AdvancedEntity[]): number {
    if (entities.length === 0) return 0;
    const sum = entities.reduce((acc, e) => acc + e.importance, 0);
    return Math.round((sum / entities.length) * 100) / 100;
  }

  groupEntityTypes(entities: AdvancedEntity[]): Record<string, number> {
    const groups: Record<string, number> = {};
    entities.forEach(e => {
      groups[e.type] = (groups[e.type] || 0) + 1;
    });
    return groups;
  }
}
