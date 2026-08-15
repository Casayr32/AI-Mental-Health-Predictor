#!/bin/bash

# 1. Bilow Python Flask AI Service background-ka
python app.py &

# 2. Sug ilaa uu Flask ka soo kacayo (oo ka jawaabayo port 5001)
echo "Waiting for Python AI service to start..."
until curl -s http://127.0.0.1:5001/predict > /dev/null; do
    sleep 1
done
echo "Python AI service is up and running!"

# 3. Markuu Flask diyaar noqdo, bilow Node.js backend-ka
cd backend
node server.js
