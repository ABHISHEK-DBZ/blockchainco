from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import sqlite3
from datetime import datetime
import uuid
from typing import Any, Dict, List, Tuple, Optional, cast

app = Flask(__name__)
# Configure CORS to avoid duplicate headers and allow custom request headers used by the frontend
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
                "Origin",
            ],
            "expose_headers": ["X-Request-Id", "X-Request-ID"],
            "supports_credentials": True,
        }
    },
)

# Database setup
DB_FILE = 'blue_carbon_registry.db'
_db_initialized: bool = False

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
    
    # Carbon Credits table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS carbon_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            price_per_credit REAL DEFAULT 50.0,
            issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT FALSE,
            blockchain_hash TEXT,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Field Data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS field_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            data_type TEXT NOT NULL,
            measurement_value REAL,
            measurement_unit TEXT,
            location_lat REAL,
            location_lng REAL,
            collected_by INTEGER,
            collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (collected_by) REFERENCES users (id)
        )
    ''')
    
    # Verification Reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            verifier_name TEXT NOT NULL,
            verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            report_url TEXT,
            findings TEXT,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            credit_id INTEGER NOT NULL,
            buyer_id INTEGER,
            seller_id INTEGER,
            amount REAL NOT NULL,
            price_per_credit REAL NOT NULL,
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            transaction_hash TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (credit_id) REFERENCES carbon_credits (id),
            FOREIGN KEY (buyer_id) REFERENCES users (id),
            FOREIGN KEY (seller_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def ensure_schema():
    """Ensure schema migrations for existing databases (adds missing columns safely)."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        # Helper to check if a column exists
        def column_exists(table: str, column: str) -> bool:
            cursor.execute(f"PRAGMA table_info({table})")
            return any(row[1] == column for row in cursor.fetchall())

        # Handle legacy column name 'issue_date' by renaming to 'issued_date'
        if column_exists('carbon_credits', 'issue_date') and not column_exists('carbon_credits', 'issued_date'):
            cursor.execute("ALTER TABLE carbon_credits RENAME COLUMN issue_date TO issued_date")

        # Add issued_date to carbon_credits if missing
        if not column_exists('carbon_credits', 'issued_date'):
            cursor.execute("ALTER TABLE carbon_credits ADD COLUMN issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

        # Add verified to carbon_credits if missing
        if not column_exists('carbon_credits', 'verified'):
            cursor.execute("ALTER TABLE carbon_credits ADD COLUMN verified BOOLEAN DEFAULT 0")

        # Add blockchain_hash to carbon_credits if missing
        if not column_exists('carbon_credits', 'blockchain_hash'):
            cursor.execute("ALTER TABLE carbon_credits ADD COLUMN blockchain_hash TEXT")

        # Add carbon_sequestration to projects if missing
        if not column_exists('projects', 'carbon_sequestration'):
            cursor.execute("ALTER TABLE projects ADD COLUMN carbon_sequestration REAL DEFAULT 0")

        conn.commit()
    finally:
        conn.close()

def seed_sample_data():
    """Add sample data to the database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        # Check if data already exists
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] > 0:
            return

        # Add sample users
        users = [
            ('admin', 'admin@bluecarbon.org', 'admin123', 'admin', 'Blue Carbon Registry'),
            ('developer1', 'dev1@mangrove.org', 'dev123', 'developer', 'Mangrove Restoration Inc'),
            ('verifier1', 'verify1@carboncert.org', 'verify123', 'verifier', 'Carbon Certification Ltd'),
            ('buyer1', 'buyer1@carbontrade.com', 'buyer123', 'buyer', 'Carbon Trading Corp')
        ]

        cursor.executemany('''
            INSERT INTO users (username, email, password_hash, role, organization)
            VALUES (?, ?, ?, ?, ?)
        ''', users)

        # Add sample projects
        projects = [
            ('Sundarbans Mangrove Restoration', 'Large-scale mangrove restoration project in the Sundarbans delta', 
             'West Bengal, India', 21.9497, 88.9411, 100.5, 'mangrove', 'implementation', 1, 250.75),
            ('Great Barrier Reef Seagrass Recovery', 'Seagrass meadow restoration and conservation project', 
             'Queensland, Australia', -16.2861, 145.7781, 75.3, 'seagrass', 'monitoring', 2, 180.50),
            ('Gulf Coast Salt Marsh Protection', 'Coastal salt marsh ecosystem restoration and protection', 
             'Louisiana, USA', 29.3477, -89.7905, 120.8, 'salt_marsh', 'planning', 2, 0.0),
            ('Coral Triangle Blue Carbon Initiative', 'Multi-species coastal ecosystem restoration', 
             'Philippines', 14.5995, 120.9842, 200.0, 'mangrove', 'implementation', 1, 450.25),
            ('North Sea Kelp Forest Restoration', 'Large-scale kelp forest restoration project', 
             'North Sea, UK', 54.5260, 3.2115, 85.7, 'kelp_forest', 'monitoring', 2, 320.15)
        ]

        cursor.executemany('''
            INSERT INTO projects (name, description, location, latitude, longitude, area_hectares, 
                                ecosystem_type, status, created_by, carbon_sequestration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', projects)

        # Add sample carbon credits (handle legacy schemas)
        credits_seed: List[Tuple[int, float, float, str, bool, Optional[str]]] = [
            (1, 50000, 52.0, '2024-01-15', True, 'bc1a2b3c4d5e6f7g8h9i0j'),
            (2, 30000, 48.5, '2024-01-10', True, 'bc2b3c4d5e6f7g8h9i0j1k'),
            (4, 75000, 55.0, '2024-01-20', True, 'bc3c4d5e6f7g8h9i0j1k2l'),
            (5, 40000, 50.0, '2024-01-25', False, None),
            (1, 25000, 53.0, '2024-02-01', False, None)
        ]

        cursor.execute("PRAGMA table_info(carbon_credits)")
        cc_cols = [r[1] for r in cursor.fetchall()]
        insert_cols: List[str] = ['project_id', 'amount', 'price_per_credit']
        date_cols: List[str] = []
        if 'issued_date' in cc_cols:
            date_cols.append('issued_date')
        if 'issue_date' in cc_cols:
            date_cols.append('issue_date')
        insert_cols.extend(date_cols)
        if 'verified' in cc_cols:
            insert_cols.append('verified')
        if 'blockchain_hash' in cc_cols:
            insert_cols.append('blockchain_hash')

        placeholders = ', '.join(['?'] * len(insert_cols))
        sql = f"INSERT INTO carbon_credits ({', '.join(insert_cols)}) VALUES ({placeholders})"

        seed_rows: List[Tuple[Any, ...]] = []
        for (proj_id, amt, ppc, date_str, verified, bhash) in credits_seed:
            row: List[Any] = [proj_id, amt, ppc]
            for _ in date_cols:
                row.append(date_str)
            if 'verified' in cc_cols:
                row.append(1 if verified else 0)
            if 'blockchain_hash' in cc_cols:
                row.append(bhash)
            seed_rows.append(tuple(row))

        cursor.executemany(sql, seed_rows)

        # Add sample field data
        field_data = [
            (1, 'biomass_measurement', 125.5, 'kg/hectare', 21.9500, 88.9400, 2, '2024-01-01', 'Initial biomass assessment'),
            (1, 'water_quality', 7.2, 'pH', 21.9495, 88.9415, 2, '2024-01-05', 'Water quality monitoring'),
            (2, 'seagrass_coverage', 85.2, 'percentage', -16.2860, 145.7780, 2, '2024-01-08', 'Seagrass coverage survey'),
            (4, 'soil_carbon', 45.8, 'tons/hectare', 14.5990, 120.9840, 1, '2024-01-12', 'Soil carbon content analysis'),
            (5, 'kelp_density', 12.3, 'plants/m²', 54.5250, 3.2120, 2, '2024-01-15', 'Kelp forest density measurement')
        ]

        cursor.executemany('''
            INSERT INTO field_data (project_id, data_type, measurement_value, measurement_unit, 
                                  location_lat, location_lng, collected_by, collected_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', field_data)

        conn.commit()
        print("Sample data seeded successfully!")
    finally:
        conn.close()

@app.before_request
def before_request():
    """Initialize database on first request"""
    global _db_initialized
    if not _db_initialized:
        # Set flag early to avoid re-entrancy if a request triggers another
        _db_initialized = True
        try:
            init_database()
            ensure_schema()
            seed_sample_data()
        except Exception as init_err:
            # Log and continue; endpoints may still function partially
            print(f"Initialization error: {init_err}")

# Do not manually add CORS headers here; Flask-CORS handles preflight and response headers.

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        conn.close()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'users': user_count,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

# Dashboard summary endpoint
@app.route('/api/dashboard/summary', methods=['GET'])
def dashboard_summary():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM projects")
        total_projects = cursor.fetchone()[0]

        cursor.execute("SELECT SUM(amount) FROM carbon_credits")
        total_credits = cursor.fetchone()[0] or 0

        cursor.execute("SELECT SUM(amount * price_per_credit) FROM carbon_credits")
        total_value = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM carbon_credits WHERE verified = 1")
        verified_credits = cursor.fetchone()[0]

        cursor.execute("SELECT SUM(carbon_sequestration) FROM projects")
        carbon_sequestered = cursor.fetchone()[0] or 0

        cursor.execute("SELECT SUM(area_hectares) FROM projects WHERE status != 'planning'")
        area_restored = cursor.fetchone()[0] or 0

        cursor.execute('''
            SELECT p.name, p.created_at, p.status, u.username
            FROM projects p
            JOIN users u ON p.created_by = u.id
            ORDER BY p.created_at DESC
            LIMIT 5
        ''')
        recent_projects = cursor.fetchall()

        recent_activity: List[Dict[str, Any]] = []
        for project in recent_projects:
            recent_activity.append({
                'id': len(recent_activity) + 1,
                'type': 'Project Registration',
                'description': f'{project[0]} - Status: {project[2]}',
                'timestamp': project[1],
                'icon': '🌿'
            })

        cursor.execute('''
            SELECT cc.amount, p.name, cc.issued_date
            FROM carbon_credits cc
            JOIN projects p ON cc.project_id = p.id
            ORDER BY cc.issued_date DESC
            LIMIT 3
        ''')
        recent_credits = cursor.fetchall()

        for credit in recent_credits:
            recent_activity.append({
                'id': len(recent_activity) + 1,
                'type': 'Credit Issuance',
                'description': f'{credit[0]:,} credits issued for {credit[1]}',
                'timestamp': credit[2],
                'icon': '💳'
            })

        conn.close()

        return jsonify({
            'totalProjects': total_projects,
            'totalCredits': int(total_credits),
            'totalValue': int(total_value),
            'verifiedCredits': verified_credits,
            'recentActivity': recent_activity[:10],
            'environmentalImpact': {
                'co2Sequestered': int(carbon_sequestered * 1000),
                'areaRestored': round(area_restored, 1),
                'biodiversityIndex': 8.7,
                'waterQualityImprovement': 23.5
            },
            'systemHealth': {
                'blockchain': 'Connected',
                'database': 'Operational',
                'verification': 'Active'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Alias route to support legacy/frontend calls to /projects (maps to /api/projects)
@app.route('/projects', methods=['GET'])
def projects_alias():
    return get_projects()

# Projects endpoints
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT p.*, u.username as creator_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.created_at DESC
        ''')

        projects: List[Dict[str, Any]] = []
        for row in cursor.fetchall():
            projects.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'location': row[3],
                'latitude': row[4],
                'longitude': row[5],
                'area_hectares': row[6],
                'ecosystem_type': row[7],
                'status': row[8],
                'created_by': row[9],
                'created_at': row[10],
                'carbon_sequestration': row[11],
                'creator_name': row[12]
            })

        conn.close()
        return jsonify({'projects': projects})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project_by_id(project_id: int):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT p.*, u.username as creator_name 
            FROM projects p 
            LEFT JOIN users u ON p.created_by = u.id 
            WHERE p.id = ?
        ''', (project_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Project not found'}), 404

        project = {
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'location': row[3],
            'latitude': row[4],
            'longitude': row[5],
            'area_hectares': row[6],
            'ecosystem_type': row[7],
            'status': row[8],
            'created_by': row[9],
            'created_at': row[10],
            'carbon_sequestration': row[11],
            'creator_name': row[12]
        }

        return jsonify({'project': project}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def create_project():
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO projects (name, description, location, latitude, longitude, 
                                area_hectares, ecosystem_type, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['name'],
            data.get('description', ''),
            data['location'],
            data.get('latitude'),
            data.get('longitude'),
            data['area_hectares'],
            data['ecosystem_type'],
            data.get('status', 'planning'),
            data.get('created_by', 1)  # Default to user 1
        ))
        
        project_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Project created successfully',
            'project_id': project_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id: int):
    try:
        data: Dict[str, Any] = request.get_json() or {}

        allowed_fields: List[str] = [
            'name', 'description', 'location', 'latitude', 'longitude',
            'area_hectares', 'ecosystem_type', 'status', 'carbon_sequestration'
        ]
        fields: List[str] = []
        values: List[Any] = []
        for key in allowed_fields:
            if key in data:
                fields.append(f"{key} = ?")
                values.append(data[key])

        if not fields:
            return jsonify({'error': 'No valid fields provided for update'}), 400

        values.append(project_id)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute(f"UPDATE projects SET {', '.join(fields)} WHERE id = ?", tuple(values))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Project not found'}), 404

        conn.commit()

        cursor.execute('''
            SELECT p.*, u.username as creator_name
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        ''', (project_id,))
        row = cursor.fetchone()
        conn.close()

        project = {
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'location': row[3],
            'latitude': row[4],
            'longitude': row[5],
            'area_hectares': row[6],
            'ecosystem_type': row[7],
            'status': row[8],
            'created_by': row[9],
            'created_at': row[10],
            'carbon_sequestration': row[11],
            'creator_name': row[12]
        }

        return jsonify({'message': 'Project updated successfully', 'project': project}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Carbon credits endpoints
@app.route('/api/carbon-credits', methods=['GET'])
def get_carbon_credits():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT cc.*, p.name as project_name
            FROM carbon_credits cc
            JOIN projects p ON cc.project_id = p.id
            ORDER BY cc.issued_date DESC
        ''')

        credits: List[Dict[str, Any]] = []
        for row in cursor.fetchall():
            credits.append({
                'id': row[0],
                'project_id': row[1],
                'amount': row[2],
                'price_per_credit': row[3],
                'issued_date': row[4],
                'verified': bool(row[5]),
                'blockchain_hash': row[6],
                'project_name': row[7]
            })

        conn.close()
        return jsonify({'carbon_credits': credits})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/carbon-credits', methods=['POST'])
def issue_carbon_credits():
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Generate a mock blockchain hash
        blockchain_hash = f"bc{uuid.uuid4().hex[:20]}"

        # Determine compatible columns based on existing schema
        cursor.execute("PRAGMA table_info(carbon_credits)")
        cc_cols = [r[1] for r in cursor.fetchall()]
        insert_cols: List[str] = ['project_id', 'amount', 'price_per_credit']
        now_ts = datetime.now().isoformat()
        date_cols: List[str] = []
        if 'issued_date' in cc_cols:
            date_cols.append('issued_date')
        if 'issue_date' in cc_cols:
            date_cols.append('issue_date')
        insert_cols.extend(date_cols)
        if 'verified' in cc_cols:
            insert_cols.append('verified')
        if 'blockchain_hash' in cc_cols:
            insert_cols.append('blockchain_hash')

        placeholders = ', '.join(['?'] * len(insert_cols))
        sql = f"INSERT INTO carbon_credits ({', '.join(insert_cols)}) VALUES ({placeholders})"

        values: List[Any] = [
            data['project_id'],
            data['amount'],
            data.get('price_per_credit', 50.0),
        ]
        for _ in date_cols:
            values.append(now_ts)
        if 'verified' in cc_cols:
            values.append(1 if data.get('verified', False) else 0)
        if 'blockchain_hash' in cc_cols:
            values.append(blockchain_hash if data.get('verified', False) else None)

        cursor.execute(sql, tuple(values))
        
        credit_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Carbon credits issued successfully',
            'credit_id': credit_id,
            'blockchain_hash': blockchain_hash if data.get('verified', False) else None
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Field data endpoints
@app.route('/api/field-data', methods=['GET'])
def get_field_data():
    try:
        project_id = request.args.get('project_id')

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        if project_id:
            cursor.execute('''
                SELECT fd.*, p.name as project_name, u.username as collector_name
                FROM field_data fd
                JOIN projects p ON fd.project_id = p.id
                LEFT JOIN users u ON fd.collected_by = u.id
                WHERE fd.project_id = ?
                ORDER BY fd.collected_at DESC
            ''', (project_id,))
        else:
            cursor.execute('''
                SELECT fd.*, p.name as project_name, u.username as collector_name
                FROM field_data fd
                JOIN projects p ON fd.project_id = p.id
                LEFT JOIN users u ON fd.collected_by = u.id
                ORDER BY fd.collected_at DESC
            ''')

        field_data: List[Dict[str, Any]] = []
        for row in cursor.fetchall():
            field_data.append({
                'id': row[0],
                'project_id': row[1],
                'data_type': row[2],
                'measurement_value': row[3],
                'measurement_unit': row[4],
                'location_lat': row[5],
                'location_lng': row[6],
                'collected_by': row[7],
                'collected_at': row[8],
                'notes': row[9],
                'project_name': row[10],
                'collector_name': row[11]
            })

        conn.close()
        return jsonify({'field_data': field_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/field-data', methods=['POST'])
def add_field_data():
    try:
        data = request.get_json()
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO field_data (project_id, data_type, measurement_value, measurement_unit,
                                  location_lat, location_lng, collected_by, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['project_id'],
            data['data_type'],
            data.get('measurement_value'),
            data.get('measurement_unit'),
            data.get('location_lat'),
            data.get('location_lng'),
            data.get('collected_by', 1),
            data.get('notes', '')
        ))
        
        data_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Field data added successfully',
            'data_id': data_id
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Authentication endpoints
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'msg': 'Username and password required'}), 400
        
        # For demo purposes, accept any username/password combination
        # In production, you would validate against the database
        access_token = f"demo_token_{username}_{datetime.now().timestamp()}"
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'username': username,
                'role': 'admin' if username == 'admin' else 'user'
            }
        }), 200
    except Exception as e:
        return jsonify({'msg': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'msg': 'Username, email, and password required'}), 400
        
        # For demo purposes, always return success
        # In production, you would save to database with proper password hashing
        return jsonify({
            'msg': 'User registered successfully',
            'user': {
                'username': username,
                'email': email
            }
        }), 201
    except Exception as e:
        return jsonify({'msg': str(e)}), 500

# Users endpoints
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute('SELECT id, username, email, role, organization, created_at FROM users')

        users: List[Dict[str, Any]] = []
        for row in cursor.fetchall():
            users.append({
                'id': row[0],
                'username': row[1],
                'email': row[2],
                'role': row[3],
                'organization': row[4],
                'created_at': row[5]
            })

        conn.close()
        return jsonify({'users': users})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Statistics endpoint
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Get ecosystem type distribution
        cursor.execute('SELECT ecosystem_type, COUNT(*) FROM projects GROUP BY ecosystem_type')
        ecosystem_stats = dict(cursor.fetchall())
        
        # Get project status distribution
        cursor.execute('SELECT status, COUNT(*) FROM projects GROUP BY status')
        status_stats = dict(cursor.fetchall())
        
        # Get monthly project creation
        cursor.execute('''
            SELECT strftime('%Y-%m', created_at) as month, COUNT(*) 
            FROM projects 
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 12
        ''')
        monthly_projects = dict(cursor.fetchall())
        
        # Get carbon credit verification rate
        cursor.execute('SELECT verified, COUNT(*) FROM carbon_credits GROUP BY verified')
        verification_stats = dict(cursor.fetchall())
        
        conn.close()
        
        return jsonify({
            'ecosystem_distribution': ecosystem_stats,
            'project_status': status_stats,
            'monthly_projects': monthly_projects,
            'verification_rate': verification_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Lightweight logging endpoint for frontend client logs
@app.route('/api/logs', methods=['POST'])
def ingest_logs():
    try:
        data_raw = request.get_json(silent=True)
        data: Dict[str, Any] = {}
        if isinstance(data_raw, dict):
            typed_raw = cast(Dict[str, Any], data_raw)
            for k, v in typed_raw.items():
                data[k] = v
        defaults: Dict[str, Any] = {
            'level': 'INFO',
            'message': '',
            'component': 'frontend',
            'meta': None,
        }
        merged: Dict[str, Any] = {**defaults, **data}
        level: str = str(merged['level'])
        message: str = str(merged['message'])
        component: str = str(merged['component'])
        meta: Any = merged['meta']
        ts = datetime.now().isoformat()
        print(f"[FE LOG] {ts} [{component}] {level}: {message} | meta={meta}")
        return jsonify({'status': 'accepted'}), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Server-Sent Events endpoint for simple realtime heartbeats/updates
@app.route('/sse', methods=['GET'])
def sse_stream():
    def event_stream():
        # Initial hello event so clients know the stream is open
        yield f"event: hello\n" f"data: {json.dumps({'status': 'connected', 'time': datetime.now().isoformat()})}\n\n"
        # Periodic heartbeat pings
        while True:
            # Keep-alive every 15 seconds
            import time
            time.sleep(15)
            yield f"event: ping\n" f"data: {json.dumps({'time': datetime.now().isoformat()})}\n\n"

    headers = {
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
    }
    return Response(event_stream(), mimetype='text/event-stream', headers=headers)

@app.route('/')
def index():
    return jsonify({
        'message': 'Blue Carbon Registry API',
        'version': '1.0.0',
        'status': 'operational',
        'endpoints': {
            'dashboard': '/api/dashboard/summary',
            'sse': '/sse',
            'projects': '/api/projects',
            'projects_alias': '/projects',
            'carbon_credits': '/api/carbon-credits',
            'field_data': '/api/field-data',
            'users': '/api/users',
            'statistics': '/api/statistics',
            'logs': '/api/logs',
            'health': '/health'
        }
    })

if __name__ == '__main__':
    print("🌊 Starting Blue Carbon Registry Backend...")
    print("📊 Dashboard API: http://localhost:5000/api/dashboard/summary")
    print("🌱 Projects API: http://localhost:5000/api/projects")
    print("💳 Credits API: http://localhost:5000/api/carbon-credits")
    print("📈 Field Data API: http://localhost:5000/api/field-data")
    print("👥 Users API: http://localhost:5000/api/users")
    print("📊 Statistics API: http://localhost:5000/api/statistics")
    print("🔐 Authentication API: http://localhost:5000/login")
    print("📝 Registration API: http://localhost:5000/register")
    
    # Debug: Print all registered routes
    print("\n🔍 Registered Routes:")
    for rule in app.url_map.iter_rules():
        methods = sorted(list(rule.methods or []))
        print(f"  {rule.rule} -> {rule.endpoint} [{', '.join(methods)}]")
    
    app.run(debug=False, host='127.0.0.1', port=5000)
