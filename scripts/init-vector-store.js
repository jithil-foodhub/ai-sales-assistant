#!/usr/bin/env node

/**
 * Script to initialize the LangChain vector store from FoodHub database
 * This script creates the HNSWLib vector store that will be used for RAG
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function initializeVectorStore() {
  try {
    console.log('🚀 Starting vector store initialization...');
    console.log('📁 Working directory:', process.cwd());
    
    // Check if FoodHub database exists
    const foodHubPath = path.join(__dirname, '../foodhub_database.txt');
    if (!fs.existsSync(foodHubPath)) {
      throw new Error(`FoodHub database not found at: ${foodHubPath}`);
    }
    
    console.log('✅ FoodHub database found');
    
    // Check if backend is built
    const backendPath = path.join(__dirname, '../apps/backend');
    const distPath = path.join(backendPath, 'dist');
    
    if (!fs.existsSync(distPath)) {
      console.log('🔨 Building backend first...');
      await buildBackend();
    }
    
    // Run the TypeScript initialization script
    console.log('🔄 Initializing vector store...');
    await runVectorStoreInit();
    
    console.log('✅ Vector store initialization completed successfully!');
    console.log('🎯 The vector store is now ready for RAG operations');
    
  } catch (error) {
    console.error('❌ Error initializing vector store:', error);
    process.exit(1);
  }
}

function buildBackend() {
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, '../apps/backend'),
      stdio: 'inherit'
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

function runVectorStoreInit() {
  return new Promise((resolve, reject) => {
    const initProcess = spawn('npx', ['tsx', 'src/scripts/initVectorStore.ts'], {
      cwd: path.join(__dirname, '../apps/backend'),
      stdio: 'inherit'
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Vector store initialization failed with code ${code}`));
      }
    });
  });
}

// Run the initialization
if (require.main === module) {
  initializeVectorStore();
}

module.exports = { initializeVectorStore };
