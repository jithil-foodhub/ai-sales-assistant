import dotenv from 'dotenv';
import OpenAI from 'openai';
import { PROMPTS, buildPrompt } from '../prompts';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

export interface Suggestion {
  text: string;
  offer_id: string;
  type: 'upsell' | 'cross-sell' | 'retention' | 'new-offer';
  confidence: number;
  deliver_as: 'say' | 'show' | 'email';
}

export interface SuggestionResponse {
  suggestions: Suggestion[];
  metadata: {
    reason: string;
    used_context_ids: string[];
  };
}

export class OpenAIClient {
  public client: OpenAI | null = null;
  private promptTemplate: string = '';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (process.env.OPENAI_API_KEY && process.env.MOCK_MODE !== 'true') {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI client initialized');
    } else {
      console.log('⚠️ OpenAI client in mock mode');
    }

    this.loadPromptTemplate();
  }

  private loadPromptTemplate(): void {
    try {
      const templatePath = path.join(process.cwd(), '../../prompts/pitch_template.txt');
      this.promptTemplate = fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.warn('Could not load prompt template, using default');
      this.promptTemplate = this.getDefaultPromptTemplate();
    }
  }


  async generateSuggestions(
    transcript: string,
    relevantOffers: any[],
    conversationId: string
  ): Promise<SuggestionResponse> {
    if (process.env.MOCK_MODE === 'true' || !this.client) {
      return this.generateMockSuggestions(transcript, relevantOffers, conversationId);
    }

    try {
      const prompt = buildPrompt.legacySalesAssistant(transcript, relevantOffers);
      
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
        messages: [
          {
            role: 'system',
            content: PROMPTS.SYSTEM.AI_SALES_ASSISTANT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const parsed = JSON.parse(content);
      return this.validateResponse(parsed);
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to mock suggestions
      return this.generateMockSuggestions(transcript, relevantOffers, conversationId);
    }
  }


  private generateMockSuggestions(
    transcript: string,
    relevantOffers: any[],
    conversationId: string
  ): SuggestionResponse {
    // Simple mock logic based on transcript content
    const lowerTranscript = transcript.toLowerCase();
    
    let suggestions: Suggestion[] = [];
    let reason = 'Generated based on conversation context';
    let usedContextIds: string[] = [];

    if (relevantOffers.length > 0) {
      const primaryOffer = relevantOffers[0];
      usedContextIds.push(primaryOffer.id);

      if (lowerTranscript.includes('price') || lowerTranscript.includes('cost')) {
        suggestions.push({
          text: `I can offer you our ${primaryOffer.title} at a special rate. Would you like to hear more about the pricing?`,
          offer_id: primaryOffer.id,
          type: 'upsell',
          confidence: 0.8,
          deliver_as: 'say'
        });
      } else if (lowerTranscript.includes('problem') || lowerTranscript.includes('issue')) {
        suggestions.push({
          text: `Based on what you've shared, our ${primaryOffer.title} could help solve that exact problem.`,
          offer_id: primaryOffer.id,
          type: 'new-offer',
          confidence: 0.75,
          deliver_as: 'say'
        });
      } else {
        suggestions.push({
          text: `I think you'd be interested in our ${primaryOffer.title}. It's perfect for your needs.`,
          offer_id: primaryOffer.id,
          type: 'cross-sell',
          confidence: 0.7,
          deliver_as: 'say'
        });
      }

      // Add second suggestion if we have multiple offers
      if (relevantOffers.length > 1) {
        const secondaryOffer = relevantOffers[1];
        usedContextIds.push(secondaryOffer.id);
        
        suggestions.push({
          text: `We also have ${secondaryOffer.title} which might be a great fit.`,
          offer_id: secondaryOffer.id,
          type: 'cross-sell',
          confidence: 0.6,
          deliver_as: 'show'
        });
      }
    } else {
      // No relevant offers found
      suggestions.push({
        text: "I'd love to learn more about your specific needs to suggest the best solution.",
        offer_id: 'general-inquiry',
        type: 'new-offer',
        confidence: 0.5,
        deliver_as: 'say'
      });
      reason = 'No specific offers matched, suggesting general inquiry approach';
    }

    return {
      suggestions,
      metadata: {
        reason,
        used_context_ids: usedContextIds
      }
    };
  }

  private validateResponse(response: any): SuggestionResponse {
    if (!response.suggestions || !Array.isArray(response.suggestions)) {
      throw new Error('Invalid response format: missing suggestions array');
    }

    if (!response.metadata || typeof response.metadata.reason !== 'string') {
      throw new Error('Invalid response format: missing metadata.reason');
    }

    // Validate each suggestion
    for (const suggestion of response.suggestions) {
      if (!suggestion.text || !suggestion.offer_id || !suggestion.type) {
        throw new Error('Invalid suggestion format');
      }
      
      if (!['upsell', 'cross-sell', 'retention', 'new-offer'].includes(suggestion.type)) {
        throw new Error('Invalid suggestion type');
      }
      
      if (!['say', 'show', 'email'].includes(suggestion.deliver_as)) {
        throw new Error('Invalid deliver_as value');
      }
    }

    return response as SuggestionResponse;
  }
}
