import { Pinecone } from '@pinecone-database/pinecone';
import HNSWLib from 'hnswlib-node';
import fs from 'fs';
import path from 'path';

export interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  price?: number;
  target_audience: string;
  keywords: string[];
  embedding?: number[];
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Offer;
}

export class VectorStore {
  private pinecone?: Pinecone;
  private hnswIndex?: HNSWLib.HierarchicalNSW;
  private offers: Map<string, Offer> = new Map();
  private backend: 'pinecone' | 'hnswlib';

  constructor() {
    this.backend = (process.env.VECTOR_BACKEND as 'pinecone' | 'hnswlib') || 'pinecone';
    // Initialize asynchronously
    this.initialize().catch(console.error);
  }

  private async initialize(): Promise<void> {
    if (this.backend === 'pinecone' && !process.env.MOCK_MODE) {
      await this.initializePinecone();
    } else {
      await this.initializeHNSWLib();
    }
  }

  private async initializePinecone(): Promise<void> {
    try {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENV!,
      });
      console.log('✅ Pinecone initialized');
    } catch (error) {
      console.warn('⚠️ Pinecone initialization failed, falling back to HNSWLib:', error);
      await this.initializeHNSWLib();
    }
  }

  private async initializeHNSWLib(): Promise<void> {
    try {
      const dimension = 1536; // OpenAI embedding dimension
      this.hnswIndex = new HNSWLib.HierarchicalNSW('cosine', dimension);
      this.hnswIndex.initIndex(1000); // Initial capacity
      console.log('✅ HNSWLib initialized');
    } catch (error) {
      console.error('❌ HNSWLib initialization failed:', error);
      throw error;
    }
  }

  async addOffer(offer: Offer, embedding: number[]): Promise<void> {
    this.offers.set(offer.id, { ...offer, embedding });

    if (this.backend === 'pinecone' && this.pinecone && !process.env.MOCK_MODE) {
      await this.addToPinecone(offer, embedding);
    } else {
      await this.addToHNSWLib(offer, embedding);
    }
  }

  private async addToPinecone(offer: Offer, embedding: number[]): Promise<void> {
    try {
      const index = this.pinecone!.Index('sales-offers');
      await index.upsert([{
        id: offer.id,
        values: embedding,
        metadata: {
          title: offer.title,
          description: offer.description,
          category: offer.category,
          price: offer.price,
          target_audience: offer.target_audience,
          keywords: offer.keywords.join(',')
        }
      }]);
    } catch (error) {
      console.error('Failed to add offer to Pinecone:', error);
      throw error;
    }
  }

  private async addToHNSWLib(offer: Offer, embedding: number[]): Promise<void> {
    try {
      const currentCount = this.hnswIndex!.getCurrentCount();
      if (currentCount >= this.hnswIndex!.getMaxElements()) {
        this.hnswIndex!.resizeIndex(currentCount + 100);
      }
      
      this.hnswIndex!.addPoint(embedding, currentCount);
    } catch (error) {
      console.error('Failed to add offer to HNSWLib:', error);
      throw error;
    }
  }

  async searchSimilar(queryEmbedding: number[], limit: number = 5): Promise<VectorSearchResult[]> {
    if (this.backend === 'pinecone' && this.pinecone && !process.env.MOCK_MODE) {
      return this.searchPinecone(queryEmbedding, limit);
    } else {
      return this.searchHNSWLib(queryEmbedding, limit);
    }
  }

  private async searchPinecone(queryEmbedding: number[], limit: number): Promise<VectorSearchResult[]> {
    try {
      const index = this.pinecone!.Index('sales-offers');
      const response = await index.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true
      });

      return response.matches?.map(match => ({
        id: match.id!,
        score: match.score!,
        metadata: {
          id: match.id!,
          title: match.metadata?.title || '',
          description: match.metadata?.description || '',
          category: match.metadata?.category || '',
          price: match.metadata?.price,
          target_audience: match.metadata?.target_audience || '',
          keywords: match.metadata?.keywords?.split(',') || []
        }
      })) || [];
    } catch (error) {
      console.error('Pinecone search failed:', error);
      return [];
    }
  }

  private async searchHNSWLib(queryEmbedding: number[], limit: number): Promise<VectorSearchResult[]> {
    try {
      const { neighbors, distances } = this.hnswIndex!.searchKnn(queryEmbedding, limit);
      
      return neighbors.map((neighbor, index) => {
        const offer = Array.from(this.offers.values())[neighbor];
        return {
          id: offer?.id || `offer-${neighbor}`,
          score: 1 - distances[index], // Convert distance to similarity score
          metadata: offer || {
            id: `offer-${neighbor}`,
            title: 'Unknown Offer',
            description: 'No description available',
            category: 'unknown',
            target_audience: 'general',
            keywords: []
          }
        };
      });
    } catch (error) {
      console.error('HNSWLib search failed:', error);
      return [];
    }
  }

  async loadOffersFromFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const offers = this.parseOffersFile(content);
      
      for (const offer of offers) {
        // In mock mode, we'll generate fake embeddings
        const embedding = process.env.MOCK_MODE === 'true' 
          ? this.generateMockEmbedding(offer)
          : await this.generateEmbedding(offer);
        
        await this.addOffer(offer, embedding);
      }
      
      console.log(`✅ Loaded ${offers.length} offers from ${filePath}`);
    } catch (error) {
      console.error('Failed to load offers from file:', error);
      throw error;
    }
  }

  private parseOffersFile(content: string): Offer[] {
    const offers: Offer[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    let currentOffer: Partial<Offer> = {};
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentOffer.id) {
          offers.push(currentOffer as Offer);
        }
        currentOffer = {
          id: line.substring(3).toLowerCase().replace(/\s+/g, '-'),
          title: line.substring(3)
        };
      } else if (line.startsWith('**Category:**')) {
        currentOffer.category = line.substring(13).trim();
      } else if (line.startsWith('**Price:**')) {
        const priceStr = line.substring(10).trim().replace(/[^0-9.]/g, '');
        currentOffer.price = priceStr ? parseFloat(priceStr) : undefined;
      } else if (line.startsWith('**Target:**')) {
        currentOffer.target_audience = line.substring(11).trim();
      } else if (line.startsWith('**Keywords:**')) {
        currentOffer.keywords = line.substring(13).trim().split(',').map(k => k.trim());
      } else if (line.trim() && !line.startsWith('**')) {
        currentOffer.description = (currentOffer.description || '') + line + ' ';
      }
    }
    
    if (currentOffer.id) {
      offers.push(currentOffer as Offer);
    }
    
    return offers;
  }

  private generateMockEmbedding(offer: Offer): number[] {
    // Generate a deterministic "embedding" based on offer content
    const content = `${offer.title} ${offer.description} ${offer.category} ${offer.keywords.join(' ')}`;
    const hash = this.simpleHash(content);
    
    // Generate 1536-dimensional vector with some structure
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = Math.sin(hash + i) * 0.1;
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async generateEmbedding(offer: Offer): Promise<number[]> {
    // This would call OpenAI's embedding API in a real implementation
    // For now, return mock embedding
    return this.generateMockEmbedding(offer);
  }
}
