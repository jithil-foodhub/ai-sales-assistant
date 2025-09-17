#!/usr/bin/env node

/**
 * Direct script to vectorize the FoodHub database
 * This script runs the vectorization process directly
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

async function vectorizeFoodHub() {
  try {
    console.log('🚀 Starting FoodHub database vectorization...');
    console.log('📁 Working directory:', process.cwd());
    
    // Check if FoodHub database exists
    const foodHubPath = path.join(__dirname, '../foodhub_database.txt');
    if (!fs.existsSync(foodHubPath)) {
      throw new Error(`FoodHub database not found at: ${foodHubPath}`);
    }
    
    console.log('✅ FoodHub database found');
    
    // Check if .env file exists
    const envPath = path.join(__dirname, '../apps/backend/.env');
    if (!fs.existsSync(envPath)) {
      console.log('⚠️ .env file not found, creating from .env.example...');
      const envExamplePath = path.join(__dirname, '../env.example');
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Created .env file from .env.example');
      } else {
        console.log('⚠️ No .env.example found, please create .env file with OPENAI_API_KEY');
      }
    }
    
    // Run the vectorization using tsx directly
    console.log('🔄 Running vectorization process...');
    
    const vectorizeProcess = spawn('npx', ['tsx', 'src/scripts/initVectorStore.ts'], {
      cwd: path.join(__dirname, '../apps/backend'),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });
    
    vectorizeProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FoodHub database vectorization completed successfully!');
        console.log('🎯 The vector store is now ready for RAG operations');
        console.log('');
        console.log('Next steps:');
        console.log('1. Start the backend: npm run dev:backend');
        console.log('2. Test RAG functionality: npm run test-rag');
      } else {
        console.error(`❌ Vectorization failed with code ${code}`);
        process.exit(1);
      }
    });
    
    vectorizeProcess.on('error', (error) => {
      console.error('❌ Error running vectorization process:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Error vectorizing FoodHub database:', error);
    process.exit(1);
  }
}

// Run the vectorization
if (require.main === module) {
  vectorizeFoodHub();
}

module.exports = { vectorizeFoodHub };
