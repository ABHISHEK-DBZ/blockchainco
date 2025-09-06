from datetime import datetime
from full_backend import app


def main():
    with app.test_client() as c:
        r = c.get('/health')
        print('HEALTH', r.status_code, r.json)

        r = c.get('/api/projects')
        pj = r.json or {}
        print('PROJECTS', r.status_code, len(pj.get('projects', [])))

        name = f"Test Project {datetime.now().isoformat()}"
        payload = {
            'name': name,
            'location': 'Test Location',
            'area_hectares': 1.23,
            'ecosystem_type': 'mangrove',
            'status': 'planning'
        }
        r = c.post('/api/projects', json=payload)
        print('CREATE_PROJECT', r.status_code, r.json)
        pid = (r.json or {}).get('project_id')

        if pid:
            r = c.put(f'/api/projects/{pid}', json={'status': 'monitoring'})
            print('UPDATE_PROJECT', r.status_code, (r.json or {}).get('message'))

            r = c.post('/api/carbon-credits', json={'project_id': pid, 'amount': 1000, 'verified': False})
            print('ISSUE_CREDITS', r.status_code, (r.json or {}).get('credit_id'))
        else:
            print('SKIP update/issue: no project_id returned')


if __name__ == '__main__':
    main()
