#!/bin/bash

# 1. Bilow Python Flask AI Service adigoo ka dhex wada background-ka (Port 5001)
# Hubi in magaca faylka Python uu yahay app.py (ama beddel haddii magac kale leeyahay)
python app.py &

# Sii 3 ilbiriqsi si uu Flask u soo kaco oo u raro dataset-ka iyo moodelka
sleep 3

# 2. U guur folder-ka backend oo bilow Node.js server-ka
cd backend
node server.js
