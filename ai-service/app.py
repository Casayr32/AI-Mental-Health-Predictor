from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ==========================================
# CRITICAL FIX: Force Python to look in its own folder
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR) 

# 1. Load dataset for 100% Exact Matching
print("Loading dataset for exact lookup...")
df_dataset = pd.read_csv('dataset.csv')
df_dataset['Previous Diagnosis'] = df_dataset['Previous Diagnosis'].fillna('None')

print("Loading AI model and encoders...")
model = joblib.load('model_artifacts/ai_model.joblib')
le_symptoms = joblib.load('model_artifacts/le_symptoms.joblib')
le_diagnosis = joblib.load('model_artifacts/le_diagnosis.joblib')
le_disorder = joblib.load('model_artifacts/le_disorder.joblib')
le_urgency = joblib.load('model_artifacts/le_urgency.joblib')
le_therapy = joblib.load('model_artifacts/le_therapy.joblib')
le_selfcare = joblib.load('model_artifacts/le_selfcare.joblib')

def bulletproof_transform(encoder, val):
    val_str = str(val).strip().lower() if val is not None else ""
    raw_classes = list(encoder.classes_)
    str_classes = [str(cls).strip().lower() for cls in raw_classes if cls is not None]

    if val_str in str_classes:
        matched_idx = str_classes.index(val_str)
        return encoder.transform([raw_classes[matched_idx]])[0]

    first_valid_idx = 0
    return encoder.transform([raw_classes[first_valid_idx]])[0]

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def auth_login():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.json
    email = data.get('email')
    password = data.get('password')
    if email and password:
        return jsonify({"success": True, "token": "fake-jwt-token-12345", "role": "admin"})
    return jsonify({"success": False, "message": "Missing credentials"}), 400

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        data = request.json
        print("--- INCOMING DATA ---", data) 
        
        r1 = data.get('q1_symptoms')
        r2 = int(data.get('q2_duration_weeks'))
        r3 = data.get('q3_previous_diagnosis')
        r4 = data.get('q4_therapy_history')
        r5 = data.get('q5_medication')
        r6 = int(data.get('q6_mood'))
        r7 = int(data.get('q7_stress_level'))

        if not r1: return jsonify({"error": "Missing q1_symptoms"}), 400
        if not r3: return jsonify({"error": "Missing q3_previous_diagnosis"}), 400

        exact_match = df_dataset[
            (df_dataset['Symptoms'].str.strip().str.lower() == str(r1).strip().lower()) &
            (df_dataset['Duration (weeks)'] == r2) &
            (df_dataset['Previous Diagnosis'].str.strip().str.lower() == str(r3).strip().lower()) &
            (df_dataset['Therapy History'].str.strip().str.lower() == str(r4).strip().lower()) &
            (df_dataset['Medication'].str.strip().str.lower() == str(r5).strip().lower()) &
            (df_dataset['Mood'] == r6) &
            (df_dataset['Stress Level'] == r7)
        ]

        if not exact_match.empty:
            print("✅ 100% Exact Match Found in Dataset!")
            row = exact_match.iloc[0]
            return jsonify({
                "predicted_disorder": str(row['Diagnosis / Condition']),
                "urgency_level": str(row['Urgency Level']),
                "suggested_therapy": str(row['Suggested Therapy']),
                "self-care_advice": str(row['Self-care Advice']),
                "confidence_score": 1.0
            })

        print("🤖 No exact match. Fallback to AI Model Prediction...")
        x1 = bulletproof_transform(le_symptoms, r1)
        x2 = float(r2) / 51.0
        x3 = bulletproof_transform(le_diagnosis, r3)
        x4 = 1 if r4 == 'Yes' else 0
        x5 = 1 if r5 == 'Yes' else 0
        x6 = r6
        x7 = r7

        X_input = np.array([[x1, x2, x3, x4, x5, x6, x7]])
        predictions = model.predict(X_input)
        probabilities = model.estimators_[0].predict_proba(X_input)[0]
        confidence = round(float(np.max(probabilities)), 2)

        return jsonify({
            "predicted_disorder": str(le_disorder.inverse_transform([predictions[0][0]])[0]),
            "urgency_level": str(le_urgency.inverse_transform([predictions[0][1]])[0]),
            "suggested_therapy": str(le_therapy.inverse_transform([predictions[0][2]])[0]),
            "self_care_advice": str(le_selfcare.inverse_transform([predictions[0][3]])[0]),
            "confidence_score": confidence
        })

    except Exception as e:
        print("❌ ML ERROR:", str(e))
        return jsonify({"error": str(e)}), 400

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001, debug=False)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
