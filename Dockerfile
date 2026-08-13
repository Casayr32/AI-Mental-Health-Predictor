# Isticmaal Python 3.9 si uu u noqdo mid fudud oo casri ah
FROM python:3.9

# Samee folder-ka mashruuca ee server-ka
WORKDIR /code

# Copy requirements.txt marka hore (si loo dedejiyo dhismaha)
COPY ./requirements.txt /code/requirements.txt

# Rakib dhammaan maktabadaha loo baahan yahay
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy faylasha backend-ka iyo ai-service
COPY ./backend /code/backend
COPY ./ai-service /code/ai-service

# Beddel "backend/app.py" haddii faylkaagu uu magac kale leeyahay (tusaale: main.py)
CMD ["python", "backend/app.py"]
