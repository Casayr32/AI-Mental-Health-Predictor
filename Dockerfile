FROM python:3.9-slim

# Install Node.js 20 directly into the Python environment
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

# Install Python (Flask) dependencies
COPY ai-service/requirements.txt ./ai-service/
RUN pip install --no-cache-dir -r ai-service/requirements.txt

# Install Node (Backend) dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy all actual code
COPY ai-service/ ./ai-service/
COPY backend/ ./backend/

# Expose ONLY the backend ports
EXPOSE 5000 5001

ENV PORT=5000

# Start both Flask and Node directly, no shell script needed!
CMD ["bash", "-c", "pm2 start /app/ai-service/app.py --name ai-service --interpreter python3 && pm2 start /app/backend/server.js --name backend && pm2 logs"]
