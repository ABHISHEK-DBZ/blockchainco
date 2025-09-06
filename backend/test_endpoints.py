#!/usr/bin/env python3
"""
Quick test script to verify backend authentication endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_login():
    """Test the login endpoint"""
    url = f"{BASE_URL}/login"
    data = {
        "username": "admin",
        "password": "test"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Login endpoint status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Login successful! Token: {result.get('access_token', 'No token')}")
            print(f"User: {result.get('user', 'No user info')}")
        else:
            print(f"❌ Login failed: {response.text}")
    except Exception as e:
        print(f"❌ Connection error: {e}")

def test_register():
    """Test the register endpoint"""
    url = f"{BASE_URL}/register"
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Register endpoint status: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"✅ Registration successful: {result.get('msg')}")
        else:
            print(f"❌ Registration failed: {response.text}")
    except Exception as e:
        print(f"❌ Connection error: {e}")

def test_dashboard():
    """Test the dashboard endpoint"""
    url = f"{BASE_URL}/api/dashboard/summary"
    
    try:
        response = requests.get(url)
        print(f"Dashboard endpoint status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Dashboard data retrieved successfully!")
            print(f"Total Projects: {result.get('totalProjects', 'N/A')}")
            print(f"Total Credits: {result.get('totalCredits', 'N/A')}")
        else:
            print(f"❌ Dashboard failed: {response.text}")
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    print("🧪 Testing Blue Carbon Registry Backend Endpoints")
    print("=" * 50)
    
    print("\n1. Testing Dashboard API:")
    test_dashboard()
    
    print("\n2. Testing Login API:")
    test_login()
    
    print("\n3. Testing Register API:")
    test_register()
    
    print("\n✅ Backend testing complete!")
