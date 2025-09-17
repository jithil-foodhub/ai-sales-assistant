# LangChain RAG Implementation for FoodHub

This document describes the implementation of LangChain RAG (Retrieval-Augmented Generation) for the FoodHub AI Sales Assistant.

## Overview

The RAG implementation uses:
- **LangChain** for RAG orchestration
- **OpenAI Embeddings** (text-embedding-3-small) for vector embeddings
- **HNSWLib** for local vector storage and similarity search
- **OpenAI GPT-4o-mini** for answer generation

## Architecture

```
FoodHub Database (foodhub_database.txt)
    ↓
Text Splitter (1000 chars, 200 overlap)
    ↓
OpenAI Embeddings (text-embedding-3-small)
    ↓
HNSWLib Vector Store (local storage)
    ↓
Similarity Search + GPT-4o-mini
    ↓
RAG Answer
```

## Files Structure

```
apps/backend/src/services/
├── langchainRagService.ts    # Core RAG service
├── foodhubService.ts         # Updated with RAG integration
└── ...

apps/backend/src/routes/
├── ragTest.ts               # RAG testing endpoints
└── ...

scripts/
├── init-vector-store.js     # Initialize vector store
└── test-rag.js             # Test RAG functionality
```

## Key Features

### 1. LangChainRagService
- **Vector Store Management**: Create, load, and manage HNSWLib vector store
- **Context Extraction**: Extract relevant context using similarity search
- **RAG Answer Generation**: Generate comprehensive answers using retrieval + generation
- **Statistics**: Get vector store statistics (document count, dimensions)
- **Reset Functionality**: Reset and recreate vector store

### 2. Enhanced FoodHubService
- **RAG Integration**: Seamless integration with LangChain RAG
- **Fallback Support**: Falls back to keyword matching if RAG fails
- **Async Methods**: All context extraction methods are now async
- **Service Status**: Check if RAG service is ready

### 3. API Endpoints
- `POST /api/rag/test-query` - Test RAG query functionality
- `GET /api/rag/stats` - Get vector store statistics
- `POST /api/rag/reset` - Reset vector store
- `POST /api/rag/test-context` - Test context extraction

## Usage

### 1. Initialize Vector Store

```bash
# Initialize the vector store from FoodHub database
npm run init-vector-store
```

### 2. Test RAG Functionality

```bash
# Run comprehensive RAG tests
npm run test-rag

# Test specific query
npm run test-rag "What are FoodHub POS systems?"
```

### 3. Use in Code

```typescript
import { FoodHubService } from './services/foodhubService';

const foodHubService = new FoodHubService();

// Get RAG answer
const answer = await foodHubService.getRagAnswer("Tell me about FoodHub POS systems");

// Extract relevant context
const context = await foodHubService.extractRelevantContext("POS systems pricing");

// Get context with similarity scores
const contextWithScores = await foodHubService.getRelevantContextWithScores("delivery management", 5);
```

## Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

### Vector Store Settings
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Embedding Model**: text-embedding-3-small
- **Max Results**: 5 (configurable)
- **Storage**: Local HNSWLib files

## Performance Benefits

### 1. Semantic Search
- **Better Context Matching**: Uses semantic similarity instead of keyword matching
- **Relevant Results**: More accurate context extraction
- **Reduced Noise**: Filters out irrelevant information

### 2. Cost Optimization
- **Efficient Embeddings**: Uses text-embedding-3-small (cheaper than ada-002)
- **Local Storage**: HNSWLib stores vectors locally (no Pinecone costs)
- **Smart Chunking**: Optimized chunk size for better retrieval

### 3. Scalability
- **Fast Search**: HNSWLib provides fast approximate nearest neighbor search
- **Persistent Storage**: Vector store persists between restarts
- **Easy Updates**: Can update vector store with new documents

## Testing

### 1. Vector Store Statistics
```bash
curl http://localhost:3000/api/rag/stats
```

### 2. Test RAG Query
```bash
curl -X POST http://localhost:3000/api/rag/test-query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are FoodHub competitive advantages?"}'
```

### 3. Test Context Extraction
```bash
curl -X POST http://localhost:3000/api/rag/test-context \
  -H "Content-Type: application/json" \
  -d '{"message": "POS systems and pricing"}'
```

## Monitoring

### 1. Service Status
```typescript
const isReady = foodHubService.isRagServiceReady();
```

### 2. Vector Store Stats
```typescript
const stats = await foodHubService.getVectorStoreStats();
console.log(`Documents: ${stats.totalDocuments}, Dimensions: ${stats.dimensions}`);
```

### 3. Logs
The service provides detailed logging:
- ✅ Success messages
- ❌ Error messages
- 🔍 Search operations
- 🤖 RAG operations

## Troubleshooting

### 1. Vector Store Not Found
```bash
# Reinitialize vector store
npm run init-vector-store
```

### 2. RAG Service Not Ready
- Check OpenAI API key
- Ensure vector store is initialized
- Check logs for errors

### 3. Poor Results
- Reset vector store: `POST /api/rag/reset`
- Check chunk size and overlap settings
- Verify embedding model

## Future Enhancements

1. **Hybrid Search**: Combine semantic and keyword search
2. **Query Expansion**: Expand queries with synonyms
3. **Relevance Filtering**: Filter results by relevance threshold
4. **Caching**: Cache frequent queries
5. **Analytics**: Track query performance and usage

## Dependencies

```json
{
  "langchain": "^0.1.0",
  "@langchain/openai": "^0.0.14",
  "@langchain/community": "^0.0.20",
  "hnswlib-node": "^1.3.2"
}
```

## Conclusion

The LangChain RAG implementation provides a robust, scalable, and cost-effective solution for intelligent context extraction and answer generation. It significantly improves the quality of AI responses while maintaining good performance and reasonable costs.
