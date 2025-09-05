"""
Database models for Blue Carbon Registry
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()

class ParticipantType(enum.Enum):
    VALIDATOR = "validator"
    PROJECT_DEVELOPER = "project_developer"
    INVESTOR = "investor"
    RESEARCHER = "researcher"

class ProjectStatus(enum.Enum):
    PLANNING = "planning"
    IMPLEMENTATION = "implementation"
    MONITORING = "monitoring"
    COMPLETED = "completed"
    VERIFIED = "verified"

class EcosystemType(enum.Enum):
    MANGROVE = "mangrove"
    SEAGRASS = "seagrass"
    SALT_MARSH = "salt_marsh"
    KELP_FOREST = "kelp_forest"
    COASTAL_WETLAND = "coastal_wetland"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    wallet_address = db.Column(db.String(42), unique=True, nullable=True)
    participant_type = db.Column(db.Enum(ParticipantType), nullable=False)
    organization = db.Column(db.String(200), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class RestorationProject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    area_hectares = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    photo_path = db.Column(db.String(500), nullable=True)
    ipfs_hash = db.Column(db.String(100), nullable=True)
    metadata_hash = db.Column(db.String(100), nullable=True)
    ecosystem_type = db.Column(db.Enum(EcosystemType), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum(ProjectStatus), default=ProjectStatus.PLANNING)
    verified = db.Column(db.Boolean, default=False)
    carbon_sequestration = db.Column(db.Float, nullable=True)
    
    # Smart contract data
    blockchain_project_id = db.Column(db.Integer, nullable=True)
    contract_address = db.Column(db.String(42), nullable=True)
    
    creator = db.relationship('User', backref='projects')

class FieldData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('restoration_project.id'), nullable=False)
    collector_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    data_type = db.Column(db.String(50), nullable=False)  # 'measurement', 'photo', 'sample'
    value = db.Column(db.Text, nullable=True)
    unit = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    photo_path = db.Column(db.String(500), nullable=True)
    ipfs_hash = db.Column(db.String(100), nullable=True)
    collected_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    verified = db.Column(db.Boolean, default=False)
    
    project = db.relationship('RestorationProject', backref='field_data')
    collector = db.relationship('User', backref='collected_data')

class CarbonCredit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('restoration_project.id'), nullable=False)
    token_id = db.Column(db.Integer, nullable=True)  # ERC1155 token ID
    amount = db.Column(db.Float, nullable=False)  # tons of CO2
    vintage_year = db.Column(db.Integer, nullable=False)
    verification_standard = db.Column(db.String(100), nullable=False)
    issued_to = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    retired = db.Column(db.Boolean, default=False)
    retired_at = db.Column(db.DateTime, nullable=True)
    
    project = db.relationship('RestorationProject', backref='carbon_credits')
    owner = db.relationship('User', backref='carbon_credits')

class VerificationReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('restoration_project.id'), nullable=False)
    verifier_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # 'initial', 'monitoring', 'final'
    carbon_sequestration = db.Column(db.Float, nullable=True)
    biodiversity_score = db.Column(db.Float, nullable=True)
    methodology = db.Column(db.String(200), nullable=False)
    report_document = db.Column(db.String(500), nullable=True)
    ipfs_hash = db.Column(db.String(100), nullable=True)
    verified_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    
    project = db.relationship('RestorationProject', backref='verification_reports')
    verifier = db.relationship('User', backref='verification_reports')
