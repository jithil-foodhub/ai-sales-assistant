import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { RetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from '@langchain/openai';
import fs from 'fs';
import path from 'path';

export class LangChainRagService {
  private vectorStore: HNSWLib | null = null;
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;
  private isInitialized = false;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small', // More cost-effective embedding model
    });

    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL, // Force GPT-4o-mini for cost optimization
      temperature: 0.1, // Lower temperature for more consistent responses
    });
  }

  /**
   * Initialize the vector store from the FoodHub database
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing LangChain RAG service...');
      
      const vectorStorePath = path.join(__dirname, '../../vector-store');
      
      // Check if vector store already exists
      if (fs.existsSync(vectorStorePath)) {
        console.log('📁 Loading existing vector store...');
        this.vectorStore = await HNSWLib.load(vectorStorePath, this.embeddings);
        console.log('✅ Vector store loaded successfully');
        this.isInitialized = true;
        return;
      }

      // Create new vector store from FoodHub database
      console.log('🔄 Creating new vector store from FoodHub database...');
      await this.createVectorStoreFromDatabase();
      this.isInitialized = true;
      console.log('✅ LangChain RAG service initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing LangChain RAG service:', error);
      throw error;
    }
  }

  /**
   * Create vector store from FoodHub database and website template
   */
  private async createVectorStoreFromDatabase(): Promise<void> {
    try {
      const foodHubPath = path.join(__dirname, '../../../../foodhub_database.txt');
      const templatePath = path.join(__dirname, '../../../../website_template_database.txt');
      
      let allData = '';
      
      // Load FoodHub database
      if (fs.existsSync(foodHubPath)) {
        const foodHubData = fs.readFileSync(foodHubPath, 'utf-8');
        allData += `\n\n=== FOODHUB BUSINESS DATABASE ===\n${foodHubData}`;
        console.log(`📖 Loaded FoodHub database (${foodHubData.length} characters)`);
      }
      
      // Load website template database
      if (fs.existsSync(templatePath)) {
        const templateData = fs.readFileSync(templatePath, 'utf-8');
        allData += `\n\n=== WEBSITE TEMPLATE DATABASE ===\n${templateData}`;
        console.log(`🎨 Loaded website template database (${templateData.length} characters)`);
      }
      
      console.log(`📚 Total data loaded: ${allData.length} characters`);
      
      // Split the document into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', '.', '!', '?', ';', ',', ' ', ''],
      });

      const documents = await textSplitter.createDocuments(
        [allData],
        [{ source: 'combined_database.txt' }],
        {
          chunkHeader: `FoodHub AI Context Database\n\n`,
        }
      );

      console.log(`📄 Created ${documents.length} document chunks`);

      // Create vector store
      this.vectorStore = await HNSWLib.fromDocuments(documents, this.embeddings);

      // Save vector store for future use
      const vectorStorePath = path.join(__dirname, '../../vector-store');
      await this.vectorStore.save(vectorStorePath);
      console.log('💾 Vector store saved successfully');

    } catch (error) {
      console.error('❌ Error creating vector store:', error);
      throw error;
    }
  }

  /**
   * Extract relevant context using RAG
   */
  async extractRelevantContext(query: string, maxResults: number = 5): Promise<string> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('LangChain RAG service not initialized');
    }

    try {
      console.log(`🔍 Searching for relevant context: "${query}"`);
      
      // Perform similarity search
      const results = await this.vectorStore.similaritySearch(query, maxResults);
      
      // Extract and format the relevant context
      const relevantContext = results
        .map((doc, index) => {
          const content = doc.pageContent.trim();
          const metadata = doc.metadata;
          return `[Context ${index + 1}]\n${content}\n`;
        })
        .join('\n');

      console.log(`✅ Found ${results.length} relevant chunks`);
      return relevantContext;

    } catch (error) {
      console.error('❌ Error extracting relevant context:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive answer using RAG
   */
  async getRagAnswer(query: string): Promise<string> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('LangChain RAG service not initialized');
    }

    try {
      console.log(`🤖 Generating RAG answer for: "${query}"`);
      
      // Create retrieval chain
      const retriever = this.vectorStore.asRetriever({
        k: 5, // Number of documents to retrieve
        searchType: 'similarity',
      });

      const qaChain = RetrievalQAChain.fromLLM(this.llm, retriever, {
        returnSourceDocuments: true,
        verbose: false,
      });

      // Get answer
      const result = await qaChain.call({
        query: query,
      });

      console.log('✅ RAG answer generated successfully');
      return result.text;

    } catch (error) {
      console.error('❌ Error generating RAG answer:', error);
      throw error;
    }
  }

  /**
   * Get relevant context with similarity scores
   */
  async getRelevantContextWithScores(query: string, maxResults: number = 5): Promise<Array<{content: string, score: number, metadata: any}>> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('LangChain RAG service not initialized');
    }

    try {
      console.log(`🔍 Searching with scores for: "${query}"`);
      
      // Perform similarity search with scores
      const results = await this.vectorStore.similaritySearchWithScore(query, maxResults);
      
      const contextWithScores = results.map(([doc, score]) => ({
        content: doc.pageContent.trim(),
        score: score,
        metadata: doc.metadata,
      }));

      console.log(`✅ Found ${results.length} relevant chunks with scores`);
      return contextWithScores;

    } catch (error) {
      console.error('❌ Error getting context with scores:', error);
      throw error;
    }
  }

  /**
   * Update vector store with new documents
   */
  async updateVectorStore(newDocuments: Document[]): Promise<void> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('LangChain RAG service not initialized');
    }

    try {
      console.log('🔄 Updating vector store with new documents...');
      
      // Add new documents to existing vector store
      await this.vectorStore.addDocuments(newDocuments);
      
      // Save updated vector store
      const vectorStorePath = path.join(__dirname, '../../vector-store');
      await this.vectorStore.save(vectorStorePath);
      
      console.log('✅ Vector store updated successfully');

    } catch (error) {
      console.error('❌ Error updating vector store:', error);
      throw error;
    }
  }

  /**
   * Get vector store statistics
   */
  async getVectorStoreStats(): Promise<{totalDocuments: number, dimensions: number}> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('LangChain RAG service not initialized');
    }

    try {
      // Get the underlying index to access statistics
      const index = (this.vectorStore as any).index;
      const totalDocuments = index.getCurrentCount();
      
      // Try to get dimensions, fallback to 1536 if not available
      let dimensions = 1536; // Default for text-embedding-3-small
      try {
        if (typeof index.getDimension === 'function') {
          dimensions = index.getDimension();
        } else if (index.dimension) {
          dimensions = index.dimension;
        }
      } catch (dimError) {
        console.log('⚠️ Could not get dimensions, using default:', dimensions);
      }
      
      return {
        totalDocuments,
        dimensions,
      };

    } catch (error) {
      console.error('❌ Error getting vector store stats:', error);
      // Return default stats if we can't get them
      return {
        totalDocuments: 0,
        dimensions: 1536
      };
    }
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset vector store (delete and recreate)
   */
  async resetVectorStore(): Promise<void> {
    try {
      console.log('🔄 Resetting vector store...');
      
      const vectorStorePath = path.join(__dirname, '../../vector-store');
      
      // Delete existing vector store
      if (fs.existsSync(vectorStorePath)) {
        fs.rmSync(vectorStorePath, { recursive: true, force: true });
        console.log('🗑️ Existing vector store deleted');
      }
      
      // Reset initialization state
      this.isInitialized = false;
      this.vectorStore = null;
      
      // Recreate vector store
      await this.createVectorStoreFromDatabase();
      this.isInitialized = true;
      
      console.log('✅ Vector store reset successfully');

    } catch (error) {
      console.error('❌ Error resetting vector store:', error);
      throw error;
    }
  }
}
