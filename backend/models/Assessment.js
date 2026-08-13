const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },

    // Raw Patient Inputs (The 7 Questions)
    q1_symptoms: {
        type: String,
        required: true,
        enum: ['feeling anxious', 'excessive worry', 'trouble sleeping', 'panic attacks', 'loss of interest in activities', 'lack of concentration', 'feeling irritable', 'feeling sad', 'feeling overwhelmed']
    },
    q2_duration_weeks: {
        type: Number,
        required: true,
        min: 1,
        max: 51
    },
    q3_previous_diagnosis: {
        type: String,
        required: true,
        enum: ['None', 'OCD', 'PTSD', 'Bipolar Disorder', 'Anxiety', 'Depression']
    },
    q4_therapy_history: {
        type: String,
        required: true,
        enum: ['Yes', 'No']
    },
    q5_medication: {
        type: String,
        required: true,
        enum: ['Yes', 'No']
    },
    q6_mood: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    q7_stress_level: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },

    // AI Generated Outputs
    predicted_disorder: {
        type: String,
        required: true,
        enum: ['Depression', 'Anxiety', 'Stress', 'Burnout', 'Panic Disorder']
    },
    urgency_level: {
        type: String,
        required: true,
        enum: ['Low', 'Moderate', 'High', 'Critical']
    },
    suggested_therapy: {
        type: String,
        required: true,
        enum: ['Cognitive Behavioral Therapy', 'Psychotherapy', 'Mindfulness-Based Therapy', 'Support Groups', 'No Therapy Needed']
    },
    self_care_advice: {
        type: String,
        required: true,
        enum: ['Journaling', 'Exercise', 'Take Breaks', 'Talk to a Friend', 'Breathing Exercises', 'Meditation']
    },
    confidence_score: {
        type: Number,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } }); // Explicitly naming created_at per doc

module.exports = mongoose.model('Assessment', AssessmentSchema);