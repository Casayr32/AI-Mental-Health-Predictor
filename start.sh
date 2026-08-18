#!/bin/bash

# MindCare AI System Startup Script
set -e

echo "🚀 Starting MindCare AI System..."

# ============================================
# 1. Start AI Service (Flask) - Port 5001
# ============================================
echo "📡 Starting AI Service (Flask) on port 5001..."
cd /app/ai-service

python3 app.py &
AI_SERVICE_PID=$!
echo "✅ AI Service started with PID: $AI_SERVICE_PID"

# Wait for AI service to be ready
echo "⏳ Waiting for AI service to be ready..."
sleep 5

# ============================================
# 2. Start Backend (Node.js) - Port 5000
# ============================================
echo "📡 Starting Backend (Node.js) on port 5000..."
cd /app/backend

pm2 start server.js --name "backend" --log /app/logs/backend.log
echo "✅ Backend started"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# ============================================
# 3. Start Frontend (Static file server) - Port 3000
# ============================================
echo "🎨 Starting Frontend static server on port 3000..."
cd /app/frontend/dist

# Serve static files with a simple Node.js server or use npx serve
pm2 start npx --name "frontend" -- serve -s . -l 3000
echo "✅ Frontend started"

# Wait for frontend to be ready
sleep 2

# ============================================
# 4. Save PM2 Process List & Show Status
# ============================================
pm2 save

echo ""
echo "=========================================="
echo "🏥 MindCare AI System Status:"
echo "=========================================="
pm2 list
echo ""
echo "📊 Service Endpoints:"
echo "   - Frontend:    http://localhost:3000"
echo "   - Backend:     http://localhost:5000/api"
echo "   - AI Service:  http://localhost:5001/predict"
echo "=========================================="

# Keep script running and handle shutdown
trap 'echo "🛑 Stopping all services..."; pm2 stop all; pm2 delete all; kill $AI_SERVICE_PID 2>/dev/null; exit 0' SIGINT SIGTERM

while true; do
    sleep 60
done
