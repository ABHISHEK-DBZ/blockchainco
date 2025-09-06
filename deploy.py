#!/usr/bin/env python3
"""
Quick Deployment Script for Blockchain Carbon Credit System
Starts both frontend and backend services for production use
"""
import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command in the specified directory"""
    try:
        process = subprocess.Popen(
            command, 
            shell=True, 
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        for line in iter(process.stdout.readline, ''):
            print(f"[{cwd or 'ROOT'}] {line.strip()}")
        
        process.wait()
        return process.returncode
    except Exception as e:
        print(f"Error running command: {e}")
        return 1

def start_backend():
    """Start the Flask backend server"""
    backend_dir = Path(__file__).parent / "backend"
    print("🚀 Starting Flask Backend Server...")
    return run_command("python enhanced_backend.py", str(backend_dir))

def start_frontend():
    """Start the React frontend development server"""
    frontend_dir = Path(__file__).parent / "web-dashboard"
    print("🚀 Starting React Frontend Server...")
    return run_command("npm start", str(frontend_dir))

def check_dependencies():
    """Check if all dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python dependencies
    backend_dir = Path(__file__).parent / "backend"
    requirements_file = backend_dir / "requirements.txt"
    
    if requirements_file.exists():
        print("📦 Installing Python dependencies...")
        run_command("pip install -r requirements.txt", str(backend_dir))
    
    # Check Node dependencies
    frontend_dir = Path(__file__).parent / "web-dashboard"
    package_json = frontend_dir / "package.json"
    
    if package_json.exists():
        node_modules = frontend_dir / "node_modules"
        if not node_modules.exists():
            print("📦 Installing Node.js dependencies...")
            run_command("npm install", str(frontend_dir))

def main():
    """Main deployment function"""
    print("🌟 Blockchain Carbon Credit System - Quick Deploy")
    print("=" * 60)
    
    # Check dependencies
    check_dependencies()
    
    print("\n🎯 Starting services...")
    print("Frontend will be available at: http://localhost:3000")
    print("Backend will be available at: http://localhost:5000")
    print("\nPress Ctrl+C to stop all services")
    print("=" * 60)
    
    try:
        # Start backend in a separate thread
        backend_thread = threading.Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Give backend time to start
        time.sleep(3)
        
        # Start frontend in main thread (this will block)
        start_frontend()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        print("✅ Deployment stopped")

if __name__ == "__main__":
    main()
