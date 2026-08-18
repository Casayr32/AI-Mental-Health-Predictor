#!/bin/bash

# MindCare AI System Startup Script
# This script starts all services in the correct order

set -e

echo "🚀 Starting MindCare AI System..."

# ============================================
# 1. Start AI Service (Flask) - Port 5001
# ============================================
echo "📡 Starting AI Service (Flask) on port 5001..."
cd /app/ai-service

# Activate virtual environment and start Flask
source venv/bin/activate
python app.py &
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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend with PM2
pm2 start server.js --name "backend" --log /app/logs/backend.log
BACKEND_PID=$(pm2 jlist | jq -r '.[] | select(.name=="backend") | .pid')
echo "✅ Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# ============================================
# 3. Start Frontend (React/Vite) - Port 3000
# ============================================
echo "🎨 Starting Frontend (React/Vite) on port 3000..."
cd /app/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Start frontend with PM2
pm2 start npm --name "frontend" -- start
FRONTEND_PID=$(pm2 jlist | jq -r '.[] | select(.name=="frontend") | .pid')
echo "✅ Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 5

# ============================================
# 4. Save PM2 Process List
# ============================================
pm2 save

# ============================================
# 5. Health Check Endpoint
# ============================================
echo "🏥 Setting up health check endpoint..."

# Create health check script
cat > /app/health-check.sh << 'EOF'
#!/bin/bash

# Check if all services are running
BACKEND_STATUS=$(pm2 status backend | grep "online" | wc -l)
FRONTEND_STATUS=$(pm2 status frontend | grep "online" | wc -l)
AI_SERVICE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/predict || echo "000")

if [ "$BACKEND_STATUS" -eq 1 ] && [ "$FRONTEND_STATUS" -eq 1 ] && [ "$AI_SERVICE_STATUS" = "200" ]; then
    echo "✅ All services are healthy"
    exit 0
else
    echo "❌ Some services are not healthy"
    exit 1
fi
EOF

chmod +x /app/health-check.sh

# Create PM2 ecosystem file for auto-restart
cat > /app/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF

echo "✅ Health check setup complete"

# ============================================
# 6. Display System Status
# ============================================
echo ""
echo "=========================================="
echo "🏥 MindCare AI System Status:"
echo "=========================================="
pm2 list
echo ""
echo "📊 Service Endpoints:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://localhost:5000/api"
echo "   - AI Service: http://localhost:5001/predict"
echo "=========================================="

# Keep script running
echo ""
echo "⏳ System is running. Press Ctrl+C to stop."
echo ""

# Function to handle shutdown
trap 'echo ""; echo "🛑 Stopping all services..."; pm2 stop all; pm2 delete all; exit 0' SIGINT SIGTERM

# Keep the script alive
while true; do
    sleep 60
done
