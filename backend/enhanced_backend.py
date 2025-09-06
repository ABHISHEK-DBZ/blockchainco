from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import json
import os
import sqlite3
from datetime import datetime, timedelta
import uuid
import hashlib
import jwt
import logging
import traceback
from functools import wraps
import re
from werkzeug.security import generate_password_hash, check_password_hash
import bleach
from marshmallow import Schema, fields, ValidationError
from flask import Response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# CORS setup - allow specific dev origins and required headers
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "X-Request-Id",
                "X-Request-ID",
                "Accept",
                "Cache-Control",
                "Pragma",
            ],
            "expose_headers": ["X-Request-Id"],
        }
    },
)

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour"],
    storage_uri="memory://"
)
limiter.init_app(app)

# Database setup
DB_FILE = 'blue_carbon_registry.db'

# Validation schemas
class ProjectSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: 3 <= len(x) <= 100)
    description = fields.Str(required=True, validate=lambda x: 10 <= len(x) <= 1000)
    location = fields.Str(required=True, validate=lambda x: 3 <= len(x) <= 100)
    area_hectares = fields.Float(required=True, validate=lambda x: 0.1 <= x <= 100000)
    latitude = fields.Float(allow_none=True, validate=lambda x: -90 <= x <= 90)
    longitude = fields.Float(allow_none=True, validate=lambda x: -180 <= x <= 180)
    ecosystem_type = fields.Str(required=True, validate=lambda x: x in ['mangrove', 'seagrass', 'salt_marsh', 'kelp_forest', 'coral_reef'])

class CarbonCreditSchema(Schema):
    project_id = fields.Int(required=True, validate=lambda x: x > 0)
    amount = fields.Float(required=True, validate=lambda x: 0 < x <= 1000000)
    price_per_credit = fields.Float(required=True, validate=lambda x: 0.01 <= x <= 1000)
    verification_standard = fields.Str(required=True, validate=lambda x: 2 <= len(x) <= 50)

class FieldDataSchema(Schema):
    project_id = fields.Int(required=True, validate=lambda x: x > 0)
    data_type = fields.Str(required=True, validate=lambda x: 2 <= len(x) <= 50)
    value = fields.Float(required=True)
    unit = fields.Str(required=True, validate=lambda x: 1 <= len(x) <= 20)
    latitude = fields.Float(allow_none=True, validate=lambda x: -90 <= x <= 90)
    longitude = fields.Float(allow_none=True, validate=lambda x: -180 <= x <= 180)

class UserSchema(Schema):
    username = fields.Str(required=True, validate=lambda x: 3 <= len(x) <= 50)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 8)
    organization = fields.Str(allow_none=True, validate=lambda x: len(x) <= 100)

# Security utilities
def sanitize_input(data):
    """Sanitize input data to prevent XSS and other attacks"""
    if isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    elif isinstance(data, str):
        # Remove potentially dangerous HTML tags and scripts
        return bleach.clean(data.strip(), tags=[], strip=True)
    return data

def validate_request_data(schema):
    """Decorator to validate request data against schema"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                if not data:
                    return jsonify({'error': 'No JSON data provided'}), 400
                
                # Sanitize input
                data = sanitize_input(data)
                
                # Validate against schema
                validated_data = schema.load(data)
                g.validated_data = validated_data
                
                return f(*args, **kwargs)
            except ValidationError as err:
                logger.warning(f"Validation error: {err.messages}")
                return jsonify({'error': 'Validation failed', 'details': err.messages}), 400
            except Exception as e:
                logger.error(f"Request validation error: {str(e)}")
                return jsonify({'error': 'Invalid request data'}), 400
        return decorated_function
    return decorator

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            # For now, support both JWT and demo tokens
            if token.startswith('demo_token_'):
                # Demo token format: demo_token_username_timestamp
                parts = token.split('_')
                if len(parts) >= 3:
                    username = parts[2]
                    g.current_user = {'username': username, 'role': 'admin' if username == 'admin' else 'user'}
                else:
                    return jsonify({'error': 'Invalid token format'}), 401
            else:
                # JWT token
                payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                g.current_user = payload
            
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    return decorated_function

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        if g.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Database utilities
def get_db():
    """Get database connection"""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DB_FILE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close database connection"""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def execute_query(query, params=None, fetch=None):
    """Execute database query with error handling"""
    db = None
    try:
        db = get_db()
        cursor = db.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if fetch == 'one':
            result = cursor.fetchone()
            return dict(result) if result else None
        elif fetch == 'all':
            results = cursor.fetchall()
            return [dict(row) for row in results]
        elif fetch:  # backward compatibility for boolean
            results = cursor.fetchall()
            return [dict(row) for row in results]
        else:
            db.commit()
            return cursor.lastrowid
    except sqlite3.Error as e:
        logger.error(f"Database error: {str(e)}")
        if db:
            db.rollback()
        raise Exception(f"Database operation failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in execute_query: {str(e)}")
        if db:
            db.rollback()
        raise

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    logger.warning(f"Bad request: {request.url} - {error}")
    return jsonify({'error': 'Bad request', 'message': str(error)}), 400

@app.errorhandler(401)
def unauthorized(error):
    logger.warning(f"Unauthorized access: {request.url}")
    return jsonify({'error': 'Unauthorized'}), 401

@app.errorhandler(403)
def forbidden(error):
    logger.warning(f"Forbidden access: {request.url}")
    return jsonify({'error': 'Forbidden'}), 403

@app.errorhandler(404)
def not_found(error):
    logger.warning(f"Not found: {request.url}")
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(429)
def ratelimit_handler(e):
    logger.warning(f"Rate limit exceeded: {request.url}")
    return jsonify({'error': 'Rate limit exceeded', 'message': str(e)}), 429

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {request.url} - {error}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {request.url} - {str(e)}\n{traceback.format_exc()}")
    return jsonify({'error': 'An unexpected error occurred'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        execute_query("SELECT 1", fetch='one')
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'database': 'connected'
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 503

# Server-Sent Events endpoint for realtime updates (basic heartbeat)
@app.route('/sse')
def sse_stream():
    def event_stream():
        # Simple heartbeat every 15 seconds; replace with real events later
        import time
        while True:
            data = json.dumps({
                'type': 'heartbeat',
                'timestamp': datetime.utcnow().isoformat()
            })
            yield f"data: {data}\n\n"
            time.sleep(15)
    headers = {"Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive"}
    return Response(event_stream(), headers=headers)

# Logging endpoint
@app.route('/api/logs', methods=['POST'])
@limiter.limit("100 per minute")
def receive_log():
    """Receive frontend logs"""
    try:
        log_data = request.get_json()
        if not log_data:
            return jsonify({'error': 'No log data provided'}), 400
        
        # Log the frontend message
        level = log_data.get('level', 'INFO').upper()
        message = log_data.get('message', 'No message')
        component = log_data.get('component', 'FRONTEND')
        
        log_message = f"[{component}] {message}"
        
        if level == 'ERROR':
            logger.error(log_message, extra={'frontend_data': log_data})
        elif level == 'WARN':
            logger.warning(log_message, extra={'frontend_data': log_data})
        else:
            logger.info(log_message, extra={'frontend_data': log_data})
        
        return jsonify({'status': 'logged'}), 200
    except Exception as e:
        logger.error(f"Error receiving frontend log: {str(e)}")
        return jsonify({'error': 'Failed to log message'}), 500

# Enhanced authentication
@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per minute")
@validate_request_data(UserSchema())
def register():
    """Enhanced user registration"""
    try:
        data = g.validated_data
        
        # Check if user exists
        existing_user = execute_query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (data['username'], data['email']),
            fetch='one'
        )
        
        if existing_user:
            return jsonify({'error': 'User already exists'}), 409
        
        # Hash password
        password_hash = generate_password_hash(data['password'])
        
        # Create user
        user_id = execute_query(
            """INSERT INTO users (username, email, password_hash, organization)
               VALUES (?, ?, ?, ?)""",
            (data['username'], data['email'], password_hash, data.get('organization'))
        )
        
        logger.info(f"New user registered: {data['username']}")
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'username': data['username'],
            'role': 'user',
            'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': token,
            'user': {
                'id': user_id,
                'username': data['username'],
                'email': data['email'],
                'role': 'user'
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """Enhanced user login"""
    try:
        data = request.get_json()
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400
        
        username = sanitize_input(data['username'])
        password = data['password']
        
        # Get user from database
        user = execute_query(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            (username, username),
            fetch='one'
        )
        
        if not user or not check_password_hash(user['password_hash'], password):
            logger.warning(f"Failed login attempt for: {username}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, app.config['JWT_SECRET_KEY'], algorithm='HS256')
        
        logger.info(f"User logged in: {user['username']}")
        
        return jsonify({
            'access_token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'organization': user['organization']
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

# Demo login (for backward compatibility)
@app.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def demo_login():
    """Demo login endpoint (backward compatibility)"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'msg': 'Username and password required'}), 400
        
        # For demo purposes, accept any username/password combination
        access_token = f"demo_token_{username}_{datetime.now().timestamp()}"
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'username': username,
                'role': 'admin' if username == 'admin' else 'user'
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Demo login error: {str(e)}")
        return jsonify({'msg': 'Login failed'}), 500

def init_database():
    """Initialize the SQLite database with all necessary tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            organization TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Projects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            area_hectares REAL NOT NULL,
            ecosystem_type TEXT NOT NULL,
            status TEXT DEFAULT 'planning',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            carbon_sequestration REAL DEFAULT 0,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')
    
    # Carbon credits table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS carbon_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            price_per_credit REAL NOT NULL,
            issue_date DATE NOT NULL,
            is_verified BOOLEAN DEFAULT FALSE,
            blockchain_hash TEXT,
            verification_standard TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Field data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS field_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            data_type TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            collected_by INTEGER,
            collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (collected_by) REFERENCES users (id)
        )
    ''')
    
    # Verification reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            verifier_name TEXT NOT NULL,
            verification_date DATE NOT NULL,
            status TEXT NOT NULL,
            report_url TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            credit_id INTEGER NOT NULL,
            buyer_info TEXT,
            seller_info TEXT,
            amount REAL NOT NULL,
            price_per_credit REAL NOT NULL,
            total_price REAL NOT NULL,
            transaction_date DATE NOT NULL,
            blockchain_hash TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (credit_id) REFERENCES carbon_credits (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects with optional filtering"""
    try:
        # Get query parameters
        status = request.args.get('status')
        ecosystem_type = request.args.get('ecosystem_type')
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Build query
        query = "SELECT * FROM projects WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if ecosystem_type:
            query += " AND ecosystem_type = ?"
            params.append(ecosystem_type)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        projects = execute_query(query, params, fetch='all')
        
        return jsonify({
            'projects': projects,
            'total': len(projects),
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        return jsonify({'error': 'Failed to fetch projects'}), 500

# Backward-compatible alias for legacy frontend requests
@app.route('/projects', methods=['GET'])
def get_projects_legacy():
    return get_projects()

@app.route('/api/projects', methods=['POST'])
@require_auth
@validate_request_data(ProjectSchema())
def create_project():
    """Create a new project"""
    try:
        data = g.validated_data
        user_id = g.current_user.get('user_id', 1)  # Default for demo tokens
        
        project_id = execute_query(
            """INSERT INTO projects (name, description, location, latitude, longitude, 
               area_hectares, ecosystem_type, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (data['name'], data['description'], data['location'], 
             data.get('latitude'), data.get('longitude'), 
             data['area_hectares'], data['ecosystem_type'], user_id)
        )
        
        # Fetch the created project
        project = execute_query(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,),
            fetch='one'
        )
        
        logger.info(f"Project created: {data['name']} (ID: {project_id})")
        
        return jsonify({
            'message': 'Project created successfully',
            'project': project
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return jsonify({'error': 'Failed to create project'}), 500

@app.route('/api/carbon-credits', methods=['GET'])
def get_carbon_credits():
    """Get all carbon credits"""
    try:
        credits = execute_query(
            """SELECT cc.*, p.name as project_name, p.location as project_location
               FROM carbon_credits cc
               JOIN projects p ON cc.project_id = p.id
               ORDER BY cc.created_at DESC""",
            fetch='all'
        )
        
        return jsonify({
            'carbon_credits': credits,
            'total': len(credits)
        })
        
    except Exception as e:
        logger.error(f"Error fetching carbon credits: {str(e)}")
        return jsonify({'error': 'Failed to fetch carbon credits'}), 500

@app.route('/api/carbon-credits', methods=['POST'])
@require_auth
@validate_request_data(CarbonCreditSchema())
def issue_carbon_credits():
    """Issue new carbon credits"""
    try:
        data = g.validated_data
        
        # Verify project exists
        project = execute_query(
            "SELECT id FROM projects WHERE id = ?",
            (data['project_id'],),
            fetch='one'
        )
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Generate blockchain hash (simulate)
        blockchain_hash = hashlib.sha256(
            f"{data['project_id']}{data['amount']}{datetime.now().isoformat()}".encode()
        ).hexdigest()
        
        credit_id = execute_query(
            """INSERT INTO carbon_credits (project_id, amount, price_per_credit, 
               issue_date, blockchain_hash, verification_standard)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (data['project_id'], data['amount'], data['price_per_credit'],
             datetime.now().date(), blockchain_hash, data['verification_standard'])
        )
        
        # Fetch the created credit
        credit = execute_query(
            """SELECT cc.*, p.name as project_name
               FROM carbon_credits cc
               JOIN projects p ON cc.project_id = p.id
               WHERE cc.id = ?""",
            (credit_id,),
            fetch='one'
        )
        
        logger.info(f"Carbon credits issued: {data['amount']} for project {data['project_id']}")
        
        return jsonify({
            'message': 'Carbon credits issued successfully',
            'credit': credit
        }), 201
        
    except Exception as e:
        logger.error(f"Error issuing carbon credits: {str(e)}")
        return jsonify({'error': 'Failed to issue carbon credits'}), 500

@app.route('/api/field-data', methods=['GET'])
def get_field_data():
    """Get all field data"""
    try:
        project_id = request.args.get('project_id', type=int)
        data_type = request.args.get('data_type')
        
        query = """SELECT fd.*, p.name as project_name, u.username as collected_by_name
                   FROM field_data fd
                   JOIN projects p ON fd.project_id = p.id
                   LEFT JOIN users u ON fd.collected_by = u.id
                   WHERE 1=1"""
        params = []
        
        if project_id:
            query += " AND fd.project_id = ?"
            params.append(project_id)
        
        if data_type:
            query += " AND fd.data_type = ?"
            params.append(data_type)
        
        query += " ORDER BY fd.collected_at DESC"
        
        field_data = execute_query(query, params, fetch='all')
        
        return jsonify({
            'field_data': field_data,
            'total': len(field_data)
        })
        
    except Exception as e:
        logger.error(f"Error fetching field data: {str(e)}")
        return jsonify({'error': 'Failed to fetch field data'}), 500

@app.route('/api/field-data', methods=['POST'])
@require_auth
@validate_request_data(FieldDataSchema())
def add_field_data():
    """Add new field data"""
    try:
        data = g.validated_data
        user_id = g.current_user.get('user_id', 1)
        
        # Verify project exists
        project = execute_query(
            "SELECT id FROM projects WHERE id = ?",
            (data['project_id'],),
            fetch='one'
        )
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        field_data_id = execute_query(
            """INSERT INTO field_data (project_id, data_type, value, unit, 
               latitude, longitude, collected_by)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (data['project_id'], data['data_type'], data['value'], data['unit'],
             data.get('latitude'), data.get('longitude'), user_id)
        )
        
        # Fetch the created field data
        field_data = execute_query(
            """SELECT fd.*, p.name as project_name
               FROM field_data fd
               JOIN projects p ON fd.project_id = p.id
               WHERE fd.id = ?""",
            (field_data_id,),
            fetch='one'
        )
        
        logger.info(f"Field data added: {data['data_type']} for project {data['project_id']}")
        
        return jsonify({
            'message': 'Field data added successfully',
            'field_data': field_data
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding field data: {str(e)}")
        return jsonify({'error': 'Failed to add field data'}), 500

@app.route('/api/dashboard/summary', methods=['GET'])
def dashboard_summary():
    """Get dashboard summary statistics"""
    try:
        # Get statistics
        stats = {}
        
        # Total projects
        result = execute_query("SELECT COUNT(*) as count FROM projects", fetch='one')
        stats['total_projects'] = result['count'] if result else 0
        
        # Total carbon credits
        result = execute_query("SELECT SUM(amount) as total FROM carbon_credits", fetch='one')
        stats['total_carbon_credits'] = result['total'] if result and result['total'] else 0
        
        # Total users
        result = execute_query("SELECT COUNT(*) as count FROM users", fetch='one')
        stats['total_users'] = result['count'] if result else 0
        
        # Active projects
        result = execute_query(
            "SELECT COUNT(*) as count FROM projects WHERE status IN ('active', 'implementation')",
            fetch='one'
        )
        stats['active_projects'] = result['count'] if result else 0
        
        # Recent projects
        recent_projects = execute_query(
            "SELECT * FROM projects ORDER BY created_at DESC LIMIT 5",
            fetch='all'
        )
        
        # Recent field data
        recent_field_data = execute_query(
            """SELECT fd.*, p.name as project_name
               FROM field_data fd
               JOIN projects p ON fd.project_id = p.id
               ORDER BY fd.collected_at DESC LIMIT 10""",
            fetch='all'
        )
        
        return jsonify({
            'statistics': stats,
            'recent_projects': recent_projects,
            'recent_field_data': recent_field_data,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard summary'}), 500

@app.route('/api/users', methods=['GET'])
@require_admin
def get_users():
    """Get all users (admin only)"""
    try:
        users = execute_query(
            "SELECT id, username, email, role, organization, created_at FROM users ORDER BY created_at DESC",
            fetch='all'
        )
        
        return jsonify({
            'users': users,
            'total': len(users)
        })
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get comprehensive statistics"""
    try:
        stats = {}
        
        # Project statistics
        stats['projects'] = {
            'total': execute_query("SELECT COUNT(*) as count FROM projects", fetch='one')['count'],
            'by_status': execute_query(
                "SELECT status, COUNT(*) as count FROM projects GROUP BY status",
                fetch='all'
            ),
            'by_ecosystem': execute_query(
                "SELECT ecosystem_type, COUNT(*) as count FROM projects GROUP BY ecosystem_type",
                fetch='all'
            )
        }
        
        # Carbon credits statistics
        stats['carbon_credits'] = {
            'total_amount': execute_query(
                "SELECT COALESCE(SUM(amount), 0) as total FROM carbon_credits",
                fetch='one'
            )['total'],
            'total_value': execute_query(
                "SELECT COALESCE(SUM(amount * price_per_credit), 0) as total FROM carbon_credits",
                fetch='one'
            )['total'],
            'verified_amount': execute_query(
                "SELECT COALESCE(SUM(amount), 0) as total FROM carbon_credits WHERE is_verified = TRUE",
                fetch='one'
            )['total']
        }
        
        # Field data statistics
        stats['field_data'] = {
            'total_records': execute_query("SELECT COUNT(*) as count FROM field_data", fetch='one')['count'],
            'by_type': execute_query(
                "SELECT data_type, COUNT(*) as count FROM field_data GROUP BY data_type",
                fetch='all'
            )
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500
