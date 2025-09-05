# Admin/reporting endpoint: project summary
@app.route('/admin/project_summary')
def project_summary():
	projects = RestorationProject.query.all()
	summary = []
	for p in projects:
		credits = CarbonCredit.query.filter_by(project_id=p.id).all()
		total_credits = sum(c.amount for c in credits)
		field_data_count = FieldData.query.filter_by(project_id=p.id).count()
		summary.append({
			"project": p.to_dict(),
			"total_credits": total_credits,
			"field_data_count": field_data_count
		})
	return jsonify(summary)

# Admin/reporting endpoint: stakeholder analytics
@app.route('/admin/stakeholder_analytics')
def stakeholder_analytics():
	stakeholders = Stakeholder.query.all()
	analytics = []
	for s in stakeholders:
		credits = CarbonCredit.query.filter_by(stakeholder_id=s.id).all()
		total_credits = sum(c.amount for c in credits)
		field_data_count = FieldData.query.filter_by(stakeholder_id=s.id).count()
		analytics.append({
			"stakeholder": s.to_dict(),
			"total_credits": total_credits,
			"field_data_count": field_data_count
		})
	return jsonify(analytics)
# Blockchain integration setup (web3.py)
from web3 import Web3
# Example: connect to local Ethereum node (update as needed)
web3 = Web3(Web3.HTTPProvider('http://localhost:8545'))

# FieldData model for GPS, photos, sensor data
class FieldData(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('restoration_project.id'), nullable=False)
	stakeholder_id = db.Column(db.Integer, db.ForeignKey('stakeholder.id'), nullable=False)
	gps_lat = db.Column(db.Float, nullable=False)
	gps_long = db.Column(db.Float, nullable=False)
	photo_url = db.Column(db.String(255), nullable=True)
	sensor_data = db.Column(db.Text, nullable=True)
	uploaded_at = db.Column(db.DateTime, server_default=db.func.now())

	def to_dict(self):
		return {
			"id": self.id,
			"project_id": self.project_id,
			"stakeholder_id": self.stakeholder_id,
			"gps_lat": self.gps_lat,
			"gps_long": self.gps_long,
			"photo_url": self.photo_url,
			"sensor_data": self.sensor_data,
			"uploaded_at": self.uploaded_at
		}
# Endpoint to upload field data
@app.route('/field_data', methods=['POST'])
def upload_field_data():
	data = request.get_json()
	project_id = data.get('project_id')
	stakeholder_id = data.get('stakeholder_id')
	gps_lat = data.get('gps_lat')
	gps_long = data.get('gps_long')
	photo_url = data.get('photo_url')
	sensor_data = data.get('sensor_data')
	if not project_id or not stakeholder_id or gps_lat is None or gps_long is None:
		return jsonify({"error": "Missing required fields"}), 400
	field_data = FieldData(
		project_id=project_id,
		stakeholder_id=stakeholder_id,
		gps_lat=gps_lat,
		gps_long=gps_long,
		photo_url=photo_url,
		sensor_data=sensor_data
	)
	db.session.add(field_data)
	db.session.commit()
	return jsonify(field_data.to_dict()), 201

# Endpoint to list all field data
@app.route('/field_data', methods=['GET'])
def list_field_data():
	all_data = FieldData.query.all()
	return jsonify([d.to_dict() for d in all_data])
# Endpoint to issue a new carbon credit
@app.route('/carbon_credits', methods=['POST'])
def issue_carbon_credit():
	data = request.get_json()
	project_id = data.get('project_id')
	stakeholder_id = data.get('stakeholder_id')
	amount = data.get('amount')
	if not project_id or not stakeholder_id or amount is None:
		return jsonify({"error": "Missing required fields"}), 400
	# Call blockchain placeholder
	tx_hash = issue_carbon_credit_on_chain(project_id, stakeholder_id, amount)
	credit = CarbonCredit(project_id=project_id, stakeholder_id=stakeholder_id, amount=amount, tx_hash=tx_hash)
	db.session.add(credit)
	db.session.commit()
	return jsonify(credit.to_dict()), 201
# CarbonCredit model for tokenized credits
class CarbonCredit(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	project_id = db.Column(db.Integer, db.ForeignKey('restoration_project.id'), nullable=False)
	stakeholder_id = db.Column(db.Integer, db.ForeignKey('stakeholder.id'), nullable=False)
	amount = db.Column(db.Float, nullable=False)
	issued_at = db.Column(db.DateTime, server_default=db.func.now())
	tx_hash = db.Column(db.String(66), nullable=True)  # Blockchain transaction hash

	def to_dict(self):
		return {
			"id": self.id,
			"project_id": self.project_id,
			"stakeholder_id": self.stakeholder_id,
			"amount": self.amount,
			"issued_at": self.issued_at,
			"tx_hash": self.tx_hash
		}
# Endpoint to list all carbon credits
@app.route('/carbon_credits')
def list_carbon_credits():
	credits = CarbonCredit.query.all()
	return jsonify([c.to_dict() for c in credits])

# Placeholder for blockchain integration
def issue_carbon_credit_on_chain(project_id, stakeholder_id, amount):
	# TODO: Integrate with Ethereum smart contract
	# Example: Use web3.py to interact with contract and return tx_hash
	tx_hash = "0xPLACEHOLDER"
	return tx_hash
# Stakeholder model for NGOs, communities, panchayats
class Stakeholder(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(120), nullable=False)
	type = db.Column(db.String(50), nullable=False)  # NGO, Community, Panchayat, etc.
	contact_info = db.Column(db.String(120), nullable=True)
	onboarded_at = db.Column(db.DateTime, server_default=db.func.now())

	def to_dict(self):
		return {
			"id": self.id,
			"name": self.name,
			"type": self.type,
			"contact_info": self.contact_info,
			"onboarded_at": self.onboarded_at
		}

from flask import Flask, jsonify, request
# Endpoint to create a new restoration project
@app.route('/projects', methods=['POST'])
def create_project():
	data = request.get_json()
	name = data.get('name')
	location = data.get('location')
	area_hectares = data.get('area_hectares')
	if not name or not location or area_hectares is None:
		return jsonify({"error": "Missing required fields"}), 400
	project = RestorationProject(name=name, location=location, area_hectares=area_hectares)
	db.session.add(project)
	db.session.commit()
	return jsonify(project.to_dict()), 201
# Endpoint to create a new stakeholder
@app.route('/stakeholders', methods=['POST'])
def create_stakeholder():
	data = request.get_json()
	name = data.get('name')
	type_ = data.get('type')
	contact_info = data.get('contact_info')
	if not name or not type_:
		return jsonify({"error": "Missing required fields"}), 400
	stakeholder = Stakeholder(name=name, type=type_, contact_info=contact_info)
	db.session.add(stakeholder)
	db.session.commit()
	return jsonify(stakeholder.to_dict()), 201
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Configure PostgreSQL connection (update with your credentials)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost:5432/bluecarbon_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Sample model for restoration projects
class RestorationProject(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(120), nullable=False)
	location = db.Column(db.String(120), nullable=False)
	area_hectares = db.Column(db.Float, nullable=False)
	created_at = db.Column(db.DateTime, server_default=db.func.now())

	def to_dict(self):
		return {
			"id": self.id,
			"name": self.name,
			"location": self.location,
			"area_hectares": self.area_hectares,
			"created_at": self.created_at
		}

@app.route('/')
def home():
	return jsonify({"message": "Blue Carbon Registry Backend is running."})

# Endpoint to list all restoration projects
# Endpoint to list all restoration projects
@app.route('/projects')
def list_projects():
	projects = RestorationProject.query.all()
	return jsonify([p.to_dict() for p in projects])

# Endpoint to list all stakeholders
@app.route('/stakeholders')
def list_stakeholders():
	stakeholders = Stakeholder.query.all()
	return jsonify([s.to_dict() for s in stakeholders])

if __name__ == '__main__':
	# Create tables if they don't exist
	with app.app_context():
		db.create_all()
	app.run(debug=True)
