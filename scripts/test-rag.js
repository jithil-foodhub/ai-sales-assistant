#!/usr/bin/env node

/**
 * Test script for LangChain RAG functionality
 * This script demonstrates the RAG capabilities with various queries
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRagFunctionality() {
  console.log('🧪 Testing LangChain RAG Functionality\n');
  
  const testQueries = [
    'What is FoodHub and what services do they offer?',
    'Tell me about FoodHub POS systems and their features',
    'How does FoodHub handle delivery management?',
    'What are the pricing options for FoodHub services?',
    'What payment solutions does FoodHub provide?',
    'Tell me about FoodHub kitchen display systems',
    'What integrations are available with FoodHub?',
    'How many restaurant partners does FoodHub have?',
    'What are FoodHub competitive advantages?',
    'Tell me about FoodHub global operations'
  ];

  try {
    // Test 1: Check vector store stats
    console.log('📊 Checking vector store statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/rag/stats`);
    console.log('Vector Store Stats:', JSON.stringify(statsResponse.data, null, 2));
    console.log('');

    // Test 2: Test context extraction
    console.log('🔍 Testing context extraction...');
    const contextResponse = await axios.post(`${BASE_URL}/api/rag/test-context`, {
      message: 'POS systems and pricing'
    });
    console.log('Context Extraction Result:');
    console.log('- RAG Service Ready:', contextResponse.data.data.ragServiceReady);
    console.log('- Relevant Context Length:', contextResponse.data.data.relevantContext.length);
    console.log('- Context with Scores:', contextResponse.data.data.contextWithScores.length, 'chunks');
    console.log('');

    // Test 3: Test RAG queries
    console.log('🤖 Testing RAG queries...\n');
    
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`Query ${i + 1}: ${query}`);
      
      try {
        const response = await axios.post(`${BASE_URL}/api/rag/test-query`, {
          query: query
        });
        
        const data = response.data.data;
        console.log(`✅ RAG Service Ready: ${data.ragServiceReady}`);
        console.log(`📝 Answer Length: ${data.ragAnswer.length} characters`);
        console.log(`🔍 Relevant Context: ${data.relevantContext.length} chunks`);
        console.log(`📊 Vector Store Stats: ${data.vectorStoreStats ? `${data.vectorStoreStats.totalDocuments} documents, ${data.vectorStoreStats.dimensions} dimensions` : 'N/A'}`);
        
        // Show first 200 characters of the answer
        const answerPreview = data.ragAnswer.substring(0, 200) + (data.ragAnswer.length > 200 ? '...' : '');
        console.log(`💬 Answer Preview: ${answerPreview}`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ Error with query: ${error.response?.data?.error || error.message}`);
        console.log('');
      }
    }

    console.log('🎉 RAG functionality testing completed!');

  } catch (error) {
    console.error('❌ Error testing RAG functionality:', error.response?.data?.error || error.message);
  }
}

async function testSpecificQuery(query) {
  console.log(`🔍 Testing specific query: "${query}"\n`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/rag/test-query`, {
      query: query
    });
    
    const data = response.data.data;
    console.log('📊 Results:');
    console.log(`- RAG Service Ready: ${data.ragServiceReady}`);
    console.log(`- Answer Length: ${data.ragAnswer.length} characters`);
    console.log(`- Relevant Context: ${data.relevantContext.length} chunks`);
    console.log('');
    console.log('💬 Full Answer:');
    console.log(data.ragAnswer);
    console.log('');
    console.log('🔍 Relevant Context with Scores:');
    data.relevantContext.forEach((ctx, index) => {
      console.log(`[${index + 1}] Score: ${ctx.score.toFixed(4)}`);
      console.log(`    Content: ${ctx.content.substring(0, 150)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error testing specific query:', error.response?.data?.error || error.message);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Test specific query
    const query = args.join(' ');
    testSpecificQuery(query);
  } else {
    // Run full test suite
    testRagFunctionality();
  }
}

module.exports = { testRagFunctionality, testSpecificQuery };
