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

# 1. Use Python slim image as base
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# 2. Install Node.js and npm
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Set working directory
WORKDIR /app

# ============================================
# STAGE 1: AI Service (Flask)
# ============================================
FROM python:3.9-slim AS ai-service-stage

WORKDIR /app/ai-service

# Copy requirements and install dependencies
COPY ai-service/requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI service code and model artifacts
COPY ai-service/*.py ./
COPY ai-service/model_artifacts ./model_artifacts

# Create logs directory
RUN mkdir -p /app/logs

# ============================================
# STAGE 2: Backend (Node.js)
# ============================================
FROM node:20-slim AS backend-stage

WORKDIR /app/backend

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend/ ./

# Create logs directory
RUN mkdir -p /app/logs

# ============================================
# STAGE 3: Frontend (React/Vite)
# ============================================
FROM node:20-slim AS frontend-stage

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# ============================================
# FINAL STAGE: Production Image
# ============================================
FROM python:3.9-slim

# Install PM2 for process management
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Install Python dependencies for AI service
COPY ai-service/requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI service from stage
COPY ai-service/*.py ./
COPY ai-service/model_artifacts ./model_artifacts

# Copy backend from stage
COPY backend/ ./

# Copy built frontend from stage
COPY --from=frontend-stage /app/frontend/dist ./frontend/dist

# Create necessary directories
RUN mkdir -p /app/logs && chmod +x /app/start.sh

# Expose ports for all services
# Frontend: 3000
# Backend: 5000
# AI Service: 5001
EXPOSE 3000 5000 5001

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5001/predict || exit 1

# Set environment variables
ENV PORT=3000 \
    NODE_ENV=production \
    PORT_BACKEND=5000 \
    PORT_AI=5001

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start all services using start.sh
CMD ["/app/start.sh"]


