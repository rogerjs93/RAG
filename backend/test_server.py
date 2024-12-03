from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Server is running!"

@app.route('/test')
def test():
    return "Test endpoint working!"

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Try accessing: http://127.0.0.1:5000/test")
    app.run(debug=True, host='127.0.0.1', port=5000)
