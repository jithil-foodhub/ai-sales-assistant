import { Request, Response } from 'express';
import { FoodHubService } from '../services/foodhubService';

const foodHubService = new FoodHubService();

/**
 * Test RAG functionality with a query
 */
export async function testRagQuery(req: Request, res: Response) {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log(`🧪 Testing RAG query: "${query}"`);

    // Get RAG answer
    const ragAnswer = await foodHubService.getRagAnswer(query);
    
    // Get relevant context with scores
    const contextWithScores = await foodHubService.getRelevantContextWithScores(query, 3);
    
    // Get vector store stats
    const stats = await foodHubService.getVectorStoreStats();

    res.json({
      success: true,
      data: {
        query,
        ragAnswer,
        relevantContext: contextWithScores,
        vectorStoreStats: stats,
        ragServiceReady: foodHubService.isRagServiceReady()
      }
    });

  } catch (error) {
    console.error('❌ Error testing RAG query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process RAG query'
    });
  }
}

/**
 * Get vector store statistics
 */
export async function getVectorStoreStats(req: Request, res: Response) {
  try {
    const stats = await foodHubService.getVectorStoreStats();
    
    res.json({
      success: true,
      data: {
        stats,
        ragServiceReady: foodHubService.isRagServiceReady()
      }
    });

  } catch (error) {
    console.error('❌ Error getting vector store stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vector store statistics'
    });
  }
}

/**
 * Reset vector store
 */
export async function resetVectorStore(req: Request, res: Response) {
  try {
    await foodHubService.resetVectorStore();
    
    res.json({
      success: true,
      message: 'Vector store reset successfully'
    });

  } catch (error) {
    console.error('❌ Error resetting vector store:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset vector store'
    });
  }
}

/**
 * Test context extraction
 */
export async function testContextExtraction(req: Request, res: Response) {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`🔍 Testing context extraction for: "${message}"`);

    // Get relevant context using RAG
    const relevantContext = await foodHubService.extractRelevantContext(message);
    
    // Get context with scores
    const contextWithScores = await foodHubService.getRelevantContextWithScores(message, 5);

    res.json({
      success: true,
      data: {
        message,
        relevantContext,
        contextWithScores,
        ragServiceReady: foodHubService.isRagServiceReady()
      }
    });

  } catch (error) {
    console.error('❌ Error testing context extraction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract context'
    });
  }
}
