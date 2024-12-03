import os
from dotenv import load_dotenv

load_dotenv()

username = os.getenv('MONGODB_USERNAME')
password = os.getenv('MONGODB_PASSWORD')

MONGODB_URI = f'mongodb+srv://{username}:{password}@cluster0.6f4em.mongodb.net/?retryWrites=true&w=majority'
MONGODB_DB = 'Thesis'
MONGODB_COLLECTION = 'Health_Data'

SPARK_CONFIG = {
    'spark.app.name': 'HealthDataProcessor',
    'spark.mongodb.input.uri': f'{MONGODB_URI}{MONGODB_DB}',
    'spark.mongodb.output.uri': f'{MONGODB_URI}{MONGODB_DB}',
} 