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



# 1. Isticmaal Python image rasmi ah oo ah slim
FROM python:3.9-slim

# Rakib Node.js iyo npm
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Samee folder-ka shaqada
WORKDIR /app

# 2. Cop garee requirements.txt ee Python kuna rakib
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Cop garee ai-service requirements haddii ay jiraan
COPY ai-service/requirements.txt* ./ai-service/
RUN if [ -f ai-service/requirements.txt ]; then pip install --no-cache-dir -r ai-service/requirements.txt; fi

# 3. Cop garee package.json ee backend-ka oo rakib Node modules
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm npm install || npm install

# 4. Ku laabo root-ka oo soo guuri dhammaan faylasha mashruuca
WORKDIR /app
COPY . .

# 5. Ka dhig start.sh mid la fulin karo (executable)
RUN chmod +x start.sh

# Render wuxuu isticmaalaa PORT (tusaale 10000)
ENV PORT=10000
EXPOSE 10000

# 6. Ku bilow labada server shaqada adigoo adeegsanaya start.sh
CMD ["./start.sh"]
