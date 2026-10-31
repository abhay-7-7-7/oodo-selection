# Brightloop Novelty Modules Workspace

This directory contains the independent implementation of all six novelties (N1–N6) for Brightloop.

## Quick Start

### 1. Start the Novelty Backend (Port 8001)
```powershell
cd novelty_modules\backend
# Run with virtualenv
..\..\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001 --reload
```
API Documentation will be available at: http://localhost:8001/docs

### 2. Run Novelty Backend Tests
```powershell
$env:PYTHONPATH = "D:\oodo selection\novelty_modules\backend"
..\..\backend\.venv\Scripts\pytest.exe -v novelty_modules\backend\tests
```

### 3. Start the Novelty Frontend (Port 5174)
```powershell
cd novelty_modules\frontend
pnpm dev
```
Open http://localhost:5174 in your browser.
