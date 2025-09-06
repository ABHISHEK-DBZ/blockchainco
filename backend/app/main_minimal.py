import os
import sys
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import text

# Import models
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.database_models import db, User, RestorationProject, FieldData, CarbonCredit, VerificationReport, ParticipantType, ProjectStatus, EcosystemType

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bluecarbon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)

# Add explicit CORS headers for all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    try:
        # Test database connection
        db.session.execute(text('SELECT 1'))
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

# Dashboard summary endpoint
@app.route('/api/dashboard/summary', methods=['GET'])
def dashboard_summary():
    try:
        # Return mock data for now
        return jsonify({
            'totalProjects': 127,
            'totalCredits': 1250000,
            'totalValue': 62500000,
            'recentActivity': [
                {
                    'id': 1,
                    'type': 'Project Registration',
                    'description': 'New mangrove restoration project registered in Queensland',
                    'timestamp': '2024-01-15T10:30:00Z',
                    'icon': '🌿'
                },
                {
                    'id': 2,
                    'type': 'Credit Issuance',
                    'description': '50,000 credits issued for Great Barrier Reef project',
                    'timestamp': '2024-01-14T14:45:00Z',
                    'icon': '💳'
                },
                {
                    'id': 3,
                    'type': 'Field Verification',
                    'description': 'Satellite data verification completed for NSW coastal project',
                    'timestamp': '2024-01-13T09:15:00Z',
                    'icon': '🛰️'
                }
            ],
            'environmentalImpact': {
                'co2Sequestered': 2500000,
                'areaRestored': 15750,
                'biodiversityIndex': 8.7,
                'waterQualityImprovement': 23.5
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes
@app.route('/')
def index():
    return "Blue Carbon Registry Backend is running."

# Restoration Projects
@app.route('/projects', methods=['GET'])
def get_projects():
    try:
        projects = RestorationProject.query.all()
        return {"projects": [{"id": p.id, "name": p.name, "location": p.location, "area_hectares": p.area_hectares, "description": p.description} for p in projects]}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/projects', methods=['POST'])
def add_project():
    try:
        data = request.get_json()
        project = RestorationProject(
            name=data.get('name'),
            location=data.get('location'),
            area_hectares=data.get('area_hectares'),
            description=data.get('description')
        )
        db.session.add(project)
        db.session.commit()
        return jsonify({"message": "Project added", "id": project.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Carbon Credits
@app.route('/carbon-credits', methods=['GET'])
def get_carbon_credits():
    try:
        credits = CarbonCredit.query.all()
        return {"carbon_credits": [{"id": c.id, "project_id": c.project_id, "amount": c.amount, "issued_on": str(c.issued_on)} for c in credits]}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created/verified")
    print("Starting Flask server on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
