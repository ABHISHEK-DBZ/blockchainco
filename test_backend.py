from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/dashboard/summary', methods=['GET'])
def dashboard_summary():
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

if __name__ == '__main__':
    print("Starting Blue Carbon Registry Backend...")
    print("Dashboard API available at: http://localhost:5000/api/dashboard/summary")
    app.run(debug=True, host='0.0.0.0', port=5000)
