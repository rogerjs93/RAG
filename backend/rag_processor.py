from typing import List, Dict, Any
import numpy as np
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging
from sklearn.metrics.pairwise import cosine_similarity
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class RAGProcessor:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunk_size = 500  # characters per chunk
        self.chunk_overlap = 50  # character overlap between chunks
        
        # Initialize MongoDB connection
        self.mongo_client = self._get_database_connection()
        self.db = self.mongo_client['Health_Framework']
        self.vector_collection = self.db['Vector_Store']

    def _get_database_connection(self) -> MongoClient:
        """Establish connection to MongoDB."""
        uri = os.getenv('MONGODB_URI')
        password = os.getenv('MONGODB_PASSWORD')
        
        if not uri or not password:
            raise ValueError("Missing MongoDB credentials")
        
        uri = uri.replace('<password>', password)
        
        try:
            client = MongoClient(
                uri,
                serverSelectionTimeoutMS=5000,
                appName='Health_Framework'
            )
            client.admin.command('ping')
            logger.info("Successfully connected to MongoDB!")
            return client
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    def create_chunks(self, text: str) -> List[str]:
        """Split text into chunks using character-based splitting."""
        chunks = []
        
        # Convert text to string if it's not already
        if not isinstance(text, str):
            text = json.dumps(text)
        
        # Split text into chunks
        start = 0
        while start < len(text):
            # Get chunk
            end = start + self.chunk_size
            if end > len(text):
                end = len(text)
            chunk = text[start:end]
            
            # Add chunk to list
            chunks.append(chunk)
            
            # Move to next chunk, considering overlap
            start = end - self.chunk_overlap
            
            # Break if we've reached the end
            if start >= len(text):
                break
        
        return chunks

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts."""
        try:
            embeddings = self.model.encode(texts)
            return embeddings
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise

    def store_vectors(self, chunks: List[str], metadata: Dict[str, Any] = None) -> bool:
        """Store text chunks and their vectors in MongoDB."""
        try:
            embeddings = self.generate_embeddings(chunks)
            
            # Prepare documents for storage
            documents = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                doc = {
                    'text': chunk,
                    'vector': embedding.tolist(),
                    'metadata': metadata or {},
                    'chunk_index': i
                }
                documents.append(doc)
            
            # Insert into MongoDB
            result = self.vector_collection.insert_many(documents)
            logger.info(f"Successfully stored {len(result.inserted_ids)} vectors")
            return True
            
        except Exception as e:
            logger.error(f"Error storing vectors: {str(e)}")
            return False

    def retrieve_similar(self, query: str, top_k: int = 3) -> List[Dict]:
        """Retrieve most similar chunks for a query."""
        try:
            # Generate query embedding
            query_embedding = self.generate_embeddings([query])[0]
            
            # Find similar vectors using cosine similarity
            similar_docs = []
            all_docs = list(self.vector_collection.find({}))
            
            for doc in all_docs:
                similarity = cosine_similarity(
                    [query_embedding], 
                    [doc['vector']]
                )[0][0]
                
                similar_docs.append({
                    'text': doc['text'],
                    'metadata': doc['metadata'],
                    'similarity': float(similarity)
                })
            
            # Sort by similarity and get top_k
            similar_docs.sort(key=lambda x: x['similarity'], reverse=True)
            return similar_docs[:top_k]
            
        except Exception as e:
            logger.error(f"Error retrieving similar chunks: {str(e)}")
            return []

    def process_health_data(self, health_data: Dict[str, Any]) -> bool:
        """Process health data document and store its vector representations."""
        try:
            # Convert health data to text representation
            text = json.dumps(health_data)
            
            # Create chunks
            chunks = self.create_chunks(text)
            
            # Store vectors with metadata
            metadata = {
                'document_id': str(health_data.get('_id')),
                'document_type': 'health_data',
                'timestamp': health_data.get('timestamp')
            }
            
            return self.store_vectors(chunks, metadata)
            
        except Exception as e:
            logger.error(f"Error processing health data: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    rag = RAGProcessor()
    
    # Example health data
    sample_data = {
        "_id": "123",
        "timestamp": "2024-01-20T12:00:00",
        "patient_data": {
            "condition": "Type 2 Diabetes",
            "measurements": {
                "blood_glucose": "126 mg/dL",
                "blood_pressure": "120/80"
            }
        }
    }
    
    # Process and store
    success = rag.process_health_data(sample_data)
    
    if success:
        # Test retrieval
        query = "What are the blood glucose levels?"
        similar_chunks = rag.retrieve_similar(query)
        for chunk in similar_chunks:
            print(f"Similarity: {chunk['similarity']}")
            print(f"Text: {chunk['text']}\n")
