from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import logging
from datetime import datetime
from dotenv import load_dotenv
import os
import json
import pandas as pd
from openpyxl import load_workbook
import io
import csv
import re
from alzheimers_processor import AlzheimersProcessor

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize processors
alzheimers_processor = AlzheimersProcessor()

def get_database_connection():
    uri = os.getenv('MONGODB_URI')
    password = os.getenv('MONGODB_PASSWORD')
    
    if not uri or not password:
        logger.error("Missing MongoDB credentials in .env file")
        raise ValueError("Missing MongoDB credentials")
    
    # Replace the password placeholder
    uri = uri.replace('<password>', password)
    
    try:
        # Create client with specific project settings
        client = MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            appName='Health_Framework'  # Add your project name
        )
        
        # Test connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        
        return client
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

try:
    # Get database connection
    mongo_client = get_database_connection()
    
    # Use the correct database name
    db = mongo_client['Health_Framework']
    collection = db['Health_Data']
    
    # Verify database access
    logger.info(f"Connected to database: {db.name}")
    logger.info(f"Available collections: {db.list_collection_names()}")
    
except Exception as e:
    logger.error(f"Startup error: {str(e)}")
    raise

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    try:
        # Test MongoDB connection
        mongo_client.admin.command('ping')
        return jsonify({
            'status': 'success',
            'message': 'Successfully connected to MongoDB Atlas'
        }), 200
    except Exception as e:
        logger.error(f"Test connection error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/health-data', methods=['POST', 'OPTIONS'])
def handle_health_data():
    if request.method == 'OPTIONS':
        return handle_preflight()

    try:
        data = request.get_json()
        
        # Process with Alzheimer's specific logic
        enriched_data = alzheimers_processor.process_patient_data(data)
        
        # Store in MongoDB
        result = collection.insert_one(enriched_data)
        
        return jsonify({
            'status': 'success',
            'message': 'Data processed successfully',
            'id': str(result.inserted_id),
            'risk_assessment': enriched_data['risk_assessment']
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing health data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/query', methods=['POST'])
def query_health_data():
    try:
        data = request.get_json()
        query = data.get('query')
        
        if not query:
            return jsonify({
                'status': 'error',
                'message': 'Query is required'
            }), 400
        
        # Get insights using Alzheimer's specific processor
        insights = alzheimers_processor.query_patient_insights(query)
        
        return jsonify({
            'status': 'success',
            'results': insights
        }), 200
        
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/batch-upload', methods=['POST', 'OPTIONS'])
def handle_batch_upload():
    if request.method == 'OPTIONS':
        return handle_preflight()

    try:
        files = request.files
        if not files:
            return jsonify({
                'status': 'error',
                'message': 'No files received'
            }), 400

        results = []
        for file in files.values():
            try:
                # Get file extension
                filename = file.filename
                file_ext = os.path.splitext(filename)[1].lower()
                
                # Convert file content based on type
                if file_ext in ['.xlsx', '.xls']:
                    data = process_excel_file(file)
                elif file_ext == '.csv':
                    data = process_csv_file(file)
                elif file_ext == '.json':
                    content = file.read().decode('utf-8')
                    data = json.loads(content)
                else:
                    # Try to process as text
                    data = process_text_file(file)

                # Validate and standardize data
                processed_data = standardize_health_data(data, filename)
                
                # Insert into MongoDB
                result = collection.insert_one(processed_data)
                results.append({
                    'filename': filename,
                    'id': str(result.inserted_id)
                })

            except Exception as e:
                logger.error(f"Error processing file {filename}: {str(e)}")
                results.append({
                    'filename': filename,
                    'error': str(e)
                })

        successful = len([r for r in results if 'id' in r])
        failed = len([r for r in results if 'error' in r])
        
        return jsonify({
            'status': 'success',
            'message': f'Processed {successful} files successfully ({failed} failed)',
            'results': results
        }), 201

    except Exception as e:
        logger.error(f"Error in batch upload: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error processing files: {str(e)}'
        }), 500

def process_excel_file(file):
    """Process Excel files and convert to standardized format"""
    try:
        logger.debug(f"Starting to process Excel file")
        # Read Excel file
        df = pd.read_excel(file)
        logger.debug(f"Excel data read successfully. Columns: {df.columns.tolist()}")
        
        # Convert column names to lowercase for consistency
        df.columns = df.columns.str.lower()
        
        # Comprehensive mapping of column names
        column_mapping = {
            # Blood Pressure
            'blood pressure systolic': 'bloodPressure.systolic',
            'bp systolic': 'bloodPressure.systolic',
            'systolic': 'bloodPressure.systolic',
            'blood pressure diastolic': 'bloodPressure.diastolic',
            'bp diastolic': 'bloodPressure.diastolic',
            'diastolic': 'bloodPressure.diastolic',
            
            # Oxygen Saturation
            'oxygen saturation': 'oxygenSaturation',
            'o2 saturation': 'oxygenSaturation',
            'spo2': 'oxygenSaturation',
            'oxygen': 'oxygenSaturation',
            
            # Pulse Rate
            'pulse rate': 'pulseRate',
            'pulse': 'pulseRate',
            'heart rate': 'pulseRate',
            
            # Sleep
            'sleep duration': 'sleepDuration',
            'sleep duration hours': 'sleepDuration',
            'sleep hours': 'sleepDuration',
            'sleep quality': 'sleepQuality',
            'quality of sleep': 'sleepQuality',
            
            # Temperature
            'temperature': 'temperature',
            'temp': 'temperature',
            'body temperature': 'temperature',
            
            # Notes
            'mri notes': 'mri.notes',
            'mri': 'mri.notes',
            'additional notes': 'additionalNotes',
            'notes': 'additionalNotes'
        }
        
        # Log original columns
        logger.debug(f"Original columns: {df.columns.tolist()}")
        
        # Rename columns based on mapping
        df = df.rename(columns=column_mapping)
        logger.debug(f"Columns after mapping: {df.columns.tolist()}")
        
        # Convert to dictionary
        records = df.to_dict('records')
        logger.debug(f"Converted to {len(records)} records")
        
        # Process each record to ensure proper structure
        processed_records = []
        for record in records:
            processed_record = {
                'bloodPressure': {
                    'systolic': None,
                    'diastolic': None
                },
                'oxygenSaturation': None,
                'pulseRate': None,
                'sleepDuration': None,
                'sleepQuality': None,
                'temperature': None,
                'mri': {
                    'notes': ''
                },
                'additionalNotes': ''
            }
            
            # Update blood pressure
            if 'bloodPressure.systolic' in record:
                processed_record['bloodPressure']['systolic'] = record['bloodPressure.systolic']
            if 'bloodPressure.diastolic' in record:
                processed_record['bloodPressure']['diastolic'] = record['bloodPressure.diastolic']
                
            # Update other fields
            for field in ['oxygenSaturation', 'pulseRate', 'sleepDuration', 'sleepQuality', 'temperature']:
                if field in record:
                    processed_record[field] = record[field]
                    
            # Update notes
            if 'mri.notes' in record:
                processed_record['mri']['notes'] = record['mri.notes']
            if 'additionalNotes' in record:
                processed_record['additionalNotes'] = record['additionalNotes']
                
            processed_records.append(processed_record)
        
        # Return first record if single row, otherwise return all records
        result = processed_records[0] if len(processed_records) == 1 else processed_records
        logger.debug(f"Final processed data: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing Excel file: {str(e)}")
        raise

def process_csv_file(file):
    """Process CSV files and convert to standardized format"""
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    return process_excel_file(df)  # Reuse Excel processing logic

def process_text_file(file):
    """Process text files and attempt to extract structured data"""
    content = file.read().decode('utf-8')
    
    # Initialize empty data structure
    data = {
        'heartRate': None,
        'bloodPressure': {
            'systolic': None,
            'diastolic': None
        },
        'mri': {
            'notes': ''
        },
        'additionalNotes': content  # Store full content as additional notes
    }
    
    # Try to extract structured data from text
    try:
        # Look for heart rate
        hr_match = re.search(r'heart rate:?\s*(\d+)', content.lower())
        if hr_match:
            data['heartRate'] = int(hr_match.group(1))
        
        # Look for blood pressure
        bp_match = re.search(r'blood pressure:?\s*(\d+)\s*/\s*(\d+)', content.lower())
        if bp_match:
            data['bloodPressure']['systolic'] = int(bp_match.group(1))
            data['bloodPressure']['diastolic'] = int(bp_match.group(2))
        
        # Look for MRI notes
        mri_match = re.search(r'mri:?\s*(.+?)(?=\n\n|\Z)', content, re.IGNORECASE | re.DOTALL)
        if mri_match:
            data['mri']['notes'] = mri_match.group(1).strip()
            
    except Exception as e:
        logger.warning(f"Error extracting structured data from text: {str(e)}")
    
    return data

def standardize_health_data(data, filename):
    """Standardize data format and add metadata"""
    if isinstance(data, list):
        # If multiple records, process first one
        data = data[0]
    
    # Ensure required structure
    standardized = {
        'heartRate': None,
        'bloodPressure': {
            'systolic': None,
            'diastolic': None
        },
        'mri': {
            'notes': ''
        },
        'additionalNotes': '',
        'metadata': {
            'filename': filename,
            'uploadDate': datetime.utcnow(),
            'originalFormat': os.path.splitext(filename)[1].lower()
        }
    }
    
    # Update with provided data
    if isinstance(data, dict):
        if 'heartRate' in data:
            standardized['heartRate'] = data['heartRate']
        
        if 'bloodPressure' in data and isinstance(data['bloodPressure'], dict):
            standardized['bloodPressure'].update(data['bloodPressure'])
        
        if 'mri' in data and isinstance(data['mri'], dict):
            standardized['mri'].update(data['mri'])
        
        if 'additionalNotes' in data:
            standardized['additionalNotes'] = data['additionalNotes']
    
    return standardized

def handle_preflight():
    """Handle CORS preflight requests"""
    response = jsonify({'message': 'OK'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    return response

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server...")
        app.run(debug=True, host='0.0.0.0', port=8000)
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")