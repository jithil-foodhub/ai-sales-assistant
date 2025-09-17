#!/usr/bin/env python3

from flask import Flask, request, jsonify
import hnswlib
import numpy as np
import json
import os
import pickle
from typing import List, Dict, Any

app = Flask(__name__)

class VectorService:
    def __init__(self):
        self.index = None
        self.data = {}
        self.dimension = 1536  # OpenAI embedding dimension
        self.max_elements = 10000
        self.data_file = '/app/data/vector_index.pkl'
        self.metadata_file = '/app/data/metadata.json'
        self.load_or_create_index()

    def load_or_create_index(self):
        """Load existing index or create new one"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'rb') as f:
                    data = pickle.load(f)
                    self.index = data['index']
                    self.data = data['metadata']
                print(f"Loaded existing index with {len(self.data)} items")
            else:
                self.create_new_index()
        except Exception as e:
            print(f"Error loading index: {e}")
            self.create_new_index()

    def create_new_index(self):
        """Create a new HNSW index"""
        self.index = hnswlib.Index(space='cosine', dim=self.dimension)
        self.index.init_index(max_elements=self.max_elements, ef_construction=200, M=16)
        self.data = {}
        print("Created new vector index")

    def save_index(self):
        """Save index to disk"""
        try:
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            with open(self.data_file, 'wb') as f:
                pickle.dump({
                    'index': self.index,
                    'metadata': self.data
                }, f)
            print(f"Saved index with {len(self.data)} items")
        except Exception as e:
            print(f"Error saving index: {e}")

    def add_vector(self, vector_id: str, vector: List[float], metadata: Dict[str, Any]):
        """Add a vector to the index"""
        try:
            vector_array = np.array(vector, dtype=np.float32)
            current_count = self.index.get_current_count()
            
            if current_count >= self.index.get_max_elements():
                self.index.resize_index(current_count + 1000)
            
            self.index.add_items(vector_array, [current_count])
            self.data[current_count] = {
                'id': vector_id,
                'metadata': metadata
            }
            self.save_index()
            return True
        except Exception as e:
            print(f"Error adding vector: {e}")
            return False

    def search_vectors(self, query_vector: List[float], k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        try:
            query_array = np.array([query_vector], dtype=np.float32)
            indices, distances = self.index.knn_query(query_array, k=k)
            
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx in self.data:
                    item = self.data[idx]
                    results.append({
                        'id': item['id'],
                        'score': 1 - distance,  # Convert distance to similarity
                        'metadata': item['metadata']
                    })
            
            return results
        except Exception as e:
            print(f"Error searching vectors: {e}")
            return []

# Initialize the vector service
vector_service = VectorService()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'items': len(vector_service.data),
        'dimension': vector_service.dimension
    })

@app.route('/add', methods=['POST'])
def add_vector():
    try:
        data = request.json
        vector_id = data.get('id')
        vector = data.get('vector')
        metadata = data.get('metadata', {})
        
        if not vector_id or not vector:
            return jsonify({'error': 'Missing id or vector'}), 400
        
        success = vector_service.add_vector(vector_id, vector, metadata)
        
        if success:
            return jsonify({'status': 'success', 'id': vector_id})
        else:
            return jsonify({'error': 'Failed to add vector'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['POST'])
def search_vectors():
    try:
        data = request.json
        query_vector = data.get('vector')
        k = data.get('k', 5)
        
        if not query_vector:
            return jsonify({'error': 'Missing query vector'}), 400
        
        results = vector_service.search_vectors(query_vector, k)
        
        return jsonify({
            'status': 'success',
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        'status': 'running',
        'items': len(vector_service.data),
        'dimension': vector_service.dimension,
        'max_elements': vector_service.max_elements
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
