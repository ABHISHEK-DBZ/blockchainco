"""
Initialize the database for the Blue Carbon Registry
"""
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.append(project_root)

from app.main import app, db
from models.database_models import User, RestorationProject, FieldData, CarbonCredit, VerificationReport, ParticipantType, ProjectStatus, EcosystemType

def init_database():
    """Initialize the database with tables and sample data"""
    with app.app_context():
        # Drop all tables first (for clean restart)
        db.drop_all()
        print("Dropped existing tables")
        
        # Create all tables
        db.create_all()
        print("Created all database tables")
        
        # Add sample user
        sample_user = User(
            username='admin',
            email='admin@bluecarbon.org',
            password_hash='admin123',  # In production, hash this!
            participant_type=ParticipantType.PROJECT_DEVELOPER,
            organization='Blue Carbon Registry',
            is_verified=True
        )
        db.session.add(sample_user)
        
        # Add sample projects
        sample_project1 = RestorationProject(
            name='Sundarbans Mangrove Restoration',
            location='West Bengal, India',
            area_hectares=100.5,
            description='Large-scale mangrove restoration project in the Sundarbans delta',
            latitude=21.9497,
            longitude=88.9411,
            ecosystem_type=EcosystemType.MANGROVE,
            created_by=1,
            status=ProjectStatus.IMPLEMENTATION,
            carbon_sequestration=250.75
        )
        
        sample_project2 = RestorationProject(
            name='Goa Seagrass Conservation',
            location='Goa, India',
            area_hectares=45.2,
            description='Seagrass meadow restoration and conservation project',
            latitude=15.2993,
            longitude=74.1240,
            ecosystem_type=EcosystemType.SEAGRASS,
            created_by=1,
            status=ProjectStatus.MONITORING,
            carbon_sequestration=125.30
        )
        
        sample_project3 = RestorationProject(
            name='Gujarat Salt Marsh Restoration',
            location='Gujarat, India',
            area_hectares=75.8,
            description='Coastal salt marsh ecosystem restoration',
            latitude=22.2587,
            longitude=71.1924,
            ecosystem_type=EcosystemType.SALT_MARSH,
            created_by=1,
            status=ProjectStatus.PLANNING,
            carbon_sequestration=0.0
        )
        
        db.session.add_all([sample_project1, sample_project2, sample_project3])
        
        # Commit all changes
        db.session.commit()
        print("Added sample data")
        print("Database initialization completed successfully!")

if __name__ == '__main__':
    init_database()
