#!/usr/bin/env tsx

/**
 * TypeScript script to initialize the LangChain vector store from FoodHub database
 * This script creates the HNSWLib vector store that will be used for RAG
 */

import { LangChainRagService } from '../services/langchainRagService';
import path from 'path';
import fs from 'fs';

async function initializeVectorStore() {
  try {
    console.log('🚀 Starting vector store initialization...');
    console.log('📁 Working directory:', process.cwd());
    
    // Check if FoodHub database exists
    const foodHubPath = path.join(__dirname, '../../../../foodhub_database.txt');
    if (!fs.existsSync(foodHubPath)) {
      throw new Error(`FoodHub database not found at: ${foodHubPath}`);
    }
    
    console.log('✅ FoodHub database found');
    
    // Initialize the RAG service
    console.log('🔄 Creating LangChain RAG service...');
    const ragService = new LangChainRagService();
    
    console.log('🔄 Initializing vector store...');
    await ragService.initialize();
    
    // Get vector store statistics
    console.log('📊 Getting vector store statistics...');
    try {
      const stats = await ragService.getVectorStoreStats();
      console.log('📊 Vector Store Statistics:');
      console.log(`   - Total Documents: ${stats.totalDocuments}`);
      console.log(`   - Dimensions: ${stats.dimensions}`);
    } catch (statsError) {
      console.log('⚠️ Could not get vector store statistics, but vector store is ready');
    }
    
    console.log('✅ Vector store initialization completed successfully!');
    console.log('🎯 The vector store is now ready for RAG operations');
    
    // Test the vector store with a sample query
    console.log('🧪 Testing vector store with sample query...');
    try {
      const testQuery = 'What is FoodHub and what services do they offer?';
      const testContext = await ragService.extractRelevantContext(testQuery, 3);
      console.log(`✅ Test query returned ${testContext.length} characters of context`);
    } catch (testError) {
      console.log('⚠️ Could not test vector store, but it should be ready for use');
    }
    
  } catch (error) {
    console.error('❌ Error initializing vector store:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeVectorStore();
}

export { initializeVectorStore };
