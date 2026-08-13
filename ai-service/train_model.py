import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
import joblib
import os

print("Loading dataset...")
# Load the CSV file
df = pd.read_csv('dataset.csv')

# Define exact columns from documentation
input_features = ['Symptoms', 'Duration (weeks)', 'Previous Diagnosis', 'Therapy History', 'Medication', 'Mood', 'Stress Level']
target_features = ['Diagnosis / Condition', 'Urgency Level', 'Suggested Therapy', 'Self-care Advice']

# Extract X (Inputs) and Y (Targets)
X_raw = df[input_features]
Y_raw = df[target_features]

print("Encoding input data (Mapping to mathematical vector X)...")

# 1. Encode r1: Symptoms (Categorical - Label Encoding)
le_symptoms = LabelEncoder()
X_raw['Symptoms'] = le_symptoms.fit_transform(X_raw['Symptoms'])

# 2. Encode r2: Duration (Numerical - Normalized between 0 and 1)
X_raw['Duration (weeks)'] = X_raw['Duration (weeks)'] / 51.0 

# 3. Encode r3: Previous Diagnosis (Categorical - Label Encoding)
le_diagnosis = LabelEncoder()
X_raw['Previous Diagnosis'] = le_diagnosis.fit_transform(X_raw['Previous Diagnosis'])

# 4. Encode r4: Therapy History (Binary - 0 or 1)
X_raw['Therapy History'] = X_raw['Therapy History'].map({'Yes': 1, 'No': 0})

# 5. Encode r5: Medication (Binary - 0 or 1)
X_raw['Medication'] = X_raw['Medication'].map({'Yes': 1, 'No': 0})

# r6 (Mood) and r7 (Stress Level) are already numerical 1-10, we leave them as is.

# Convert to NumPy array (This is our final X vector)
X = X_raw.values

print("Encoding target data...")
# Encode the 4 output targets
le_disorder = LabelEncoder()
le_urgency = LabelEncoder()
le_therapy = LabelEncoder()
le_selfcare = LabelEncoder()

Y_encoded = np.column_stack([
    le_disorder.fit_transform(Y_raw['Diagnosis / Condition']),
    le_urgency.fit_transform(Y_raw['Urgency Level']),
    le_therapy.fit_transform(Y_raw['Suggested Therapy']),
    le_selfcare.fit_transform(Y_raw['Self-care Advice'])
])

print("Training AI Model (Random Forest Multi-Output Classifier)...")
# We use MultiOutputClassifier so it predicts all 4 categories at once
base_model = RandomForestClassifier(n_estimators=100, random_state=42)
model = MultiOutputClassifier(base_model, n_jobs=-1)
model.fit(X, Y_encoded)

print("Saving model and encoders...")
# Create a folder to store the trained artifacts
os.makedirs('model_artifacts', exist_ok=True)

# Save the trained model
joblib.dump(model, 'model_artifacts/ai_model.joblib')

# Save the encoders so the Node.js backend knows how to decode/encode data identically
joblib.dump(le_symptoms, 'model_artifacts/le_symptoms.joblib')
joblib.dump(le_diagnosis, 'model_artifacts/le_diagnosis.joblib')
joblib.dump(le_disorder, 'model_artifacts/le_disorder.joblib')
joblib.dump(le_urgency, 'model_artifacts/le_urgency.joblib')
joblib.dump(le_therapy, 'model_artifacts/le_therapy.joblib')
joblib.dump(le_selfcare, 'model_artifacts/le_selfcare.joblib')

print("\n✅ SUCCESS: Model trained and saved successfully in the 'model_artifacts' folder!")
print("You can now close this Python script.")