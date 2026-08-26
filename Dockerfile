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
COPY start.sh ./
RUN sed -i 's/\r$//' start.sh
RUN chmod +x start.sh

RUN chmod +x start.sh

# Expose ONLY the backend ports
EXPOSE 5000 5001

ENV PORT=5000

CMD ["./start.sh"]
