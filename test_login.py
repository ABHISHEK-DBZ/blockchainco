import requests
import json

# Test login endpoint
url = "http://localhost:5000/login"
data = {
    "username": "testuser",
    "password": "testpass"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        token = response.json().get('access_token')
        print(f"Generated Token: {token}")
        print(f"Token Type: {type(token)}")
        print(f"Token Length: {len(token)}")
        
        # Check if it looks like a JWT (should have 3 parts separated by dots)
        if token and '.' in token:
            parts = token.split('.')
            print(f"Token Parts: {len(parts)} (JWT should have 3)")
        else:
            print("Token is not in JWT format (demo token)")
    
except Exception as e:
    print(f"Error: {e}")
