from main import app, db
from flask import json


def run():
    with app.app_context():
        db.create_all()
    client = app.test_client()

    # Register user
    reg_payload = {"username": "alice", "email": "alice@example.com", "password": "secret"}
    r = client.post('/register', json=reg_payload)
    print('REGISTER', r.status_code, r.json)

    # Login
    login_payload = {"email": "alice@example.com", "password": "secret"}
    r = client.post('/login', json=login_payload)
    print('LOGIN', r.status_code)
    token = (r.json or {}).get('access_token')
    assert token, 'no token from /login'

    headers = {"Authorization": f"Bearer {token}"}

    # Protected
    r = client.get('/protected', headers=headers)
    print('PROTECTED', r.status_code)

    # Create project
    proj_payload = {
        "name": "Test Project",
        "location": "Goa",
        "area_hectares": 12.5,
        "description": "Demo",
        "latitude": 15.3,
        "longitude": 73.9,
        "ecosystem_type": "mangrove"
    }
    r = client.post('/projects', json=proj_payload, headers=headers)
    print('CREATE_PROJECT', r.status_code, r.json)
    project_id = (r.json or {}).get('id')

    # List projects
    r = client.get('/projects')
    print('LIST_PROJECTS', r.status_code, len((r.json or {}).get('projects', [])))

    # Add carbon credit
    cc_payload = {
        "project_id": project_id,
        "amount": 10.0,
        "vintage_year": 2024,
        "verification_standard": "VCS",
        "issued_to": 1
    }
    r = client.post('/carbon-credits', json=cc_payload, headers=headers)
    print('ADD_CREDIT', r.status_code, r.json)

    # List credits
    r = client.get('/carbon-credits')
    print('LIST_CREDITS', r.status_code, len((r.json or {}).get('carbon_credits', [])))


if __name__ == '__main__':
    run()
