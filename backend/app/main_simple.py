import os
import sys
import json
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from sqlalchemy import text

# Import models
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.database_models import db, User, RestorationProject, FieldData, CarbonCredit, VerificationReport, ParticipantType, ProjectStatus, EcosystemType

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bluecarbon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key_here_change_in_production'

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)

# Add explicit CORS headers for all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Database initialization
def create_tables():
    """Create all database tables"""
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

# Registration endpoint
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'message': 'User already exists'}), 400
        
        # Create new user
        user = User(
            username=data['username'], 
            email=data['email'],
            password_hash=data['password'],
            participant_type=ParticipantType.PROJECT_DEVELOPER
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        # Try to find user by email first, then by username
        user = User.query.filter_by(email=data.get('email', data.get('username')), password_hash=data['password']).first()
        if not user and 'username' in data:
            user = User.query.filter_by(username=data['username'], password_hash=data['password']).first()
        
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
            
        access_token = create_access_token(identity={'username': user.username, 'id': user.id})
        return jsonify({'access_token': access_token}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        # Get actual data from database or return mock data
        total_projects = RestorationProject.query.count() or 127
        total_credits = sum([c.amount for c in CarbonCredit.query.all()]) or 1250000
        total_value = total_credits * 50 or 62500000  # $50 per credit
        
        # Recent activity - get from database or mock
        recent_activity = [
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
        ]
        
        return jsonify({
            'totalProjects': total_projects,
            'totalCredits': total_credits,
            'totalValue': total_value,
            'recentActivity': recent_activity,
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

@app.route('/carbon-credits', methods=['POST'])
def add_carbon_credit():
    try:
        data = request.get_json()
        credit = CarbonCredit(
            project_id=data.get('project_id'),
            amount=data.get('amount'),
            issued_on=data.get('issued_on')
        )
        db.session.add(credit)
        db.session.commit()
        return jsonify({"message": "Carbon credit added", "id": credit.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    current_user = get_jwt_identity()
    
    # Sample tasks for demonstration
    tasks = [
        {
            'id': 1,
            'title': 'Initial Data Collection - Sundarbans Project',
            'description': 'Collect baseline data for mangrove restoration project',
            'projectId': 1,
            'assignedTo': current_user,
            'type': 'field_data_collection',
            'priority': 'high',
            'status': 'pending',
            'dueDate': '2024-01-30'
        },
        {
            'id': 2,
            'title': 'Monthly Monitoring - Goa Seagrass',
            'description': 'Conduct monthly monitoring of seagrass restoration progress',
            'projectId': 2,
            'assignedTo': current_user,
            'type': 'monitoring',
            'priority': 'medium',
            'status': 'in_progress',
            'dueDate': '2024-01-25'
        },
        {
            'id': 3,
            'title': 'Drone Survey - Gujarat Salt Marsh',
            'description': 'Aerial survey of salt marsh conservation area',
            'projectId': 3,
            'assignedTo': current_user,
            'type': 'drone_survey',
            'priority': 'medium',
            'status': 'pending',
            'dueDate': '2024-02-05'
        }
    ]
    
    return jsonify({'tasks': tasks})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created/verified")
    print("Starting Flask server on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
