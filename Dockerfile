# ============================================
# STAGE 1: AI Service (Python/Flask)
# ============================================
FROM python:3.9-slim AS ai-service-stage

WORKDIR /app/ai-service

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements FIRST
COPY ai-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI service code, artifacts, and dataset
COPY ai-service/*.py ./
COPY ai-service/model_artifacts ./model_artifacts
COPY ai-service/dataset.csv ./

# Create logs directory
RUN mkdir -p /app/logs

# ============================================
# STAGE 2: Backend (Node.js)
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
    /app/logs

# Copy AI service
COPY --from=ai-service-stage /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=ai-service-stage /app/ai-service/*.py /app/ai-service/
COPY --from=ai-service-stage /app/ai-service/model_artifacts/ /app/ai-service/model_artifacts/
COPY --from=ai-service-stage /app/ai-service/dataset.csv /app/ai-service/

# Copy backend
COPY --from=backend-stage /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-stage /app/backend/*.js /app/backend/
COPY --from=backend-stage /app/backend/*.json /app/backend/
COPY --from=backend-stage /app/backend/config/ /app/backend/config/
COPY --from=backend-stage /app/backend/routes/ /app/backend/routes/

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ONLY the backend port now
EXPOSE 5000 5001

# Environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    PORT_AI=5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/test || exit 1

# Start services
CMD ["/app/start.sh"]
