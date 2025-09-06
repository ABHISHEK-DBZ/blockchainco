# Blockchain Carbon Credit System - Windows Deployment Script
# Starts both frontend and backend services

Write-Host "🌟 Blockchain Carbon Credit System - Quick Deploy" -ForegroundColor Green
Write-Host "=" * 60

$BackendPath = Join-Path $PSScriptRoot "backend"
$FrontendPath = Join-Path $PSScriptRoot "web-dashboard"

# Function to start backend
function Start-Backend {
    Write-Host "🚀 Starting Flask Backend Server..." -ForegroundColor Yellow
    Set-Location $BackendPath
    
    # Check if virtual environment exists and activate it
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        Write-Host "📦 Activating virtual environment..." -ForegroundColor Cyan
        & ".venv\Scripts\Activate.ps1"
    }
    
    # Install dependencies if needed
    if (Test-Path "requirements.txt") {
        Write-Host "📦 Installing Python dependencies..." -ForegroundColor Cyan
        pip install -r requirements.txt
    }
    
    # Start the backend server
    python enhanced_backend.py
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🚀 Starting React Frontend Server..." -ForegroundColor Yellow
    Set-Location $FrontendPath
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Start the frontend server
    npm start
}

Write-Host "🎯 Starting services..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "=" * 60

try {
    # Start backend in background job
    $BackendJob = Start-Job -ScriptBlock ${function:Start-Backend}
    Write-Host "✅ Backend started in background (Job ID: $($BackendJob.Id))" -ForegroundColor Green
    
    # Wait a moment for backend to initialize
    Start-Sleep -Seconds 3
    
    # Start frontend in foreground
    Start-Frontend
}
catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
}
finally {
    # Clean up background jobs
    if ($BackendJob) {
        Write-Host "🛑 Stopping backend service..." -ForegroundColor Yellow
        Stop-Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job $BackendJob -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Deployment stopped" -ForegroundColor Green
}
