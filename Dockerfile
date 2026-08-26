# ============================================
# STAGE 1: AI Service (Python/Flask)
# ============================================
FROM python:3.9-slim AS ai-service-stage

WORKDIR /app/ai-service

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements FIRST (fails fast if missing)
COPY ai-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI service code and model artifacts
COPY ai-service/*.py ./
COPY ai-service/model_artifacts ./model_artifacts
COPY ai-service/dataset.csv ./            # <--- ADDED THIS LINE

# Create logs directory
RUN mkdir -p /app/logs

# ============================================
# STAGE 2: Frontend (React/Vite)
# ============================================
FROM node:20-slim AS frontend-stage

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install ALL dependencies (vite is a dev dependency!)
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# ============================================
# STAGE 3: Backend (Node.js)
# ============================================
FROM node:20-slim AS backend-stage

WORKDIR /app/backend

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend code
COPY backend/ ./

# ============================================
# FINAL STAGE: Production Image
# ============================================
FROM node:20-slim

# Install Python and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Create directories
RUN mkdir -p /app/ai-service/model_artifacts \
    /app/backend \
    /app/frontend/dist \
    /app/logs

# Copy AI service (Python packages + code)
COPY --from=ai-service-stage /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=ai-service-stage /app/ai-service/*.py /app/ai-service/
COPY --from=ai-service-stage /app/ai-service/model_artifacts/ /app/ai-service/model_artifacts/
COPY --from=ai-service-stage /app/ai-service/dataset.csv /app/ai-service/   # <--- ADDED THIS LINE

# Copy backend
COPY --from=backend-stage /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-stage /app/backend/*.js /app/backend/
COPY --from=backend-stage /app/backend/*.json /app/backend/

# Copy built frontend
COPY --from=frontend-stage /app/frontend/dist /app/frontend/dist

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 5000 5001

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    PORT_BACKEND=5000 \
    PORT_AI=5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5001/predict || exit 1

# Start all services
CMD ["/app/start.sh"]
