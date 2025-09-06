import requests
import json

print('=== TESTING STABLE BACKEND ===')
base = 'http://127.0.0.1:5000'

try:
    health = requests.get(f'{base}/health', timeout=5)
    print(f'✅ HEALTH: {health.status_code}')
    print('   Users in DB:', health.json().get('users'))
except Exception as e:
    print(f'❌ HEALTH ERROR: {e}')

try:
    projects = requests.get(f'{base}/projects', timeout=5)
    print(f'✅ PROJECTS: {projects.status_code}')
    proj_data = projects.json()
    print(f'   Found {len(proj_data.get("projects", []))} projects')
except Exception as e:
    print(f'❌ PROJECTS ERROR: {e}')

try:
    credits = requests.get(f'{base}/api/carbon-credits', timeout=5)
    print(f'✅ CREDITS: {credits.status_code}')
    cred_data = credits.json()
    print(f'   Found {len(cred_data.get("carbon_credits", []))} credits')
except Exception as e:
    print(f'❌ CREDITS ERROR: {e}')

try:
    dash = requests.get(f'{base}/api/dashboard/summary', timeout=5)
    print(f'✅ DASHBOARD: {dash.status_code}')
    summary = dash.json()
    print(f'   Total Projects: {summary.get("totalProjects")}')
    print(f'   Total Credits: {summary.get("totalCredits")}')
except Exception as e:
    print(f'❌ DASHBOARD ERROR: {e}')

# Test authentication
try:
    login_data = {'username': 'admin', 'password': 'admin123'}
    login = requests.post(f'{base}/login', json=login_data, timeout=5)
    print(f'✅ LOGIN: {login.status_code}')
    if login.status_code == 200:
        token = login.json().get('access_token')
        print(f'   Token received: {len(token)} chars')
except Exception as e:
    print(f'❌ LOGIN ERROR: {e}')

print('\n🎉 BACKEND TESTING COMPLETE!')
