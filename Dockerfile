# # 1. Isticmaal image rasmi ah oo leh Node.js iyo Python labaduba (ama Ubuntu lagu rakibay labada)
# FROM python:3.9-slim

# # Rakib Node.js iyo npm mashiinka dhexdiisa
# RUN apt-get update && apt-get install -y curl && \
#     curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
#     apt-get install -y nodejs

# # Samee folder-ka shaqada ee server-ka
# WORKDIR /app

# # 2. Cop garee requirements.txt (haddii uu ku jiro root ama ai-service) kuna rakib maktabadaha Python
# COPY requirements.txt* ./
# RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# # Rakib sidoo kale haddii ai-service uu leeyahay requirements u gaar ah
# COPY ai-service/requirements.txt* ./ai-service/
# RUN if [ -f ai-service/requirements.txt ]; then pip install --no-cache-dir -r ai-service/requirements.txt; fi

# # 3. Cop garee package.json ee backend-ka si loo rakibo Node modules
# COPY backend/package*.json ./backend/
# WORKDIR /app/backend
# RUN npm install

# # 4. Cop garee dhammaan faylasha mashruuca
# WORKDIR /app
# COPY . .

# # 5. U guur folder-ka backend si aad halkaas uga bilowdo server-ka
# WORKDIR /app/backend

# # Dekadda (Port) uu Render isticmaalayo
# ENV PORT=10000
# EXPOSE 10000

# # Bilow backend-ka Node.js (beddel server.js haddii uu magac kale leeyahay)
# CMD ["node", "server.js"]



# ============================================
# MindCare AI System - Production Dockerfile
# ============================================
# Multi-stage build with optimized layers
# Services: Frontend (React/Vite), Backend (Node.js/Express), AI Service (Flask)
# ============================================

# ============================================
# MindCare AI System - Production Dockerfile
# ============================================
# Multi-stage build with optimized layers
# Services: Frontend (React/Vite), Backend (Node.js/Express), AI Service (Flask)
# ============================================

# ============================================
# MindCare AI System - Production Dockerfile
# ============================================
# Multi-stage build with optimized layers
# Services: Frontend (React/Vite), Backend (Node.js/Express), AI Service (Flask)
# ============================================

# ============================================
# STAGE 1: Frontend (React/Vite) - Build first
# ============================================
FROM node:20-slim AS frontend-stage

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install ALL dependencies (including dev - vite is a dev dependency!)
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# ============================================
# STAGE 2: Backend (Node.js)
# ============================================
FROM node:20-slim AS backend-stage

WORKDIR /app/backend

# Copy package files and install production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend code
COPY backend/ ./

# ============================================
# STAGE 3: AI Service (Python/Flask)
# ============================================
FROM python:3.9-slim AS ai-service-stage

WORKDIR /app/ai-service

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY ai-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI service code and model artifacts
COPY ai-service/*.py ./
COPY ai-service/model_artifacts ./model_artifacts

# Create logs directory
RUN mkdir -p /app/logs

# ============================================
# FINAL STAGE: Production Image
# ============================================
FROM node:20-slim

# Install Python and curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Create directory structure
RUN mkdir -p /app/ai-service/model_artifacts \
    /app/backend \
    /app/frontend/dist \
    /app/logs

# Copy AI service from build stage
COPY --from=ai-service-stage /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=ai-service-stage /app/ai-service/*.py /app/ai-service/
COPY --from=ai-service-stage /app/ai-service/model_artifacts/ /app/ai-service/model_artifacts/

# Copy backend from build stage
COPY --from=backend-stage /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-stage /app/backend/*.js /app/backend/
COPY --from=backend-stage /app/backend/*.json /app/backend/

# Copy built frontend from build stage
COPY --from=frontend-stage /app/frontend/dist /app/frontend/dist

# Copy and set permissions for start script
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
CMD ["/app/start.sh"]
