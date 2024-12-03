from pymongo import MongoClient
import json
from datetime import datetime
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def load_data_to_mongodb(mongodb_uri):
    try:
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        
        # Get database name from connection string or use default
        db = client['health_data']
        
        # Create or get collection
        collection = db['health_records']
        
        # Read the JSON file
        with open('health_data_samples.json', 'r') as file:
            health_records = json.load(file)
        
        # Convert string timestamps to datetime objects
        for record in health_records:
            record['timestamp'] = datetime.fromisoformat(record['timestamp'])
        
        # Create an index on user_id and timestamp for better query performance
        collection.create_index([('user_id', 1), ('timestamp', -1)])
        
        # Insert the data
        result = collection.insert_many(health_records)
        
        print(f"Successfully inserted {len(result.inserted_ids)} records into MongoDB")
        print(f"Database: health_data")
        print(f"Collection: health_records")
        
        # Print a sample query to verify the data
        sample = collection.find_one()
        print("\nSample record from database:")
        print(json.dumps(
            {k: str(v) if isinstance(v, datetime) else v for k, v in sample.items() if k != '_id'}, 
            indent=2
        ))
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    mongodb_uri = "mongodb+srv://rogerjs93:6kqZii5FvncmUdAE@healthdata.ogiln.mongodb.net/health_data?retryWrites=true&w=majority&appName=Healthdata"
    load_data_to_mongodb(mongodb_uri)
