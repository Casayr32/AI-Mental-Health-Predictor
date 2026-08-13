const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    report_type: {
        type: String,
        required: true,
        enum: ['individual', 'bulk']
    },
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: function () { return this.report_type === 'individual'; }
    },
    patient_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    }],
    date_range: {
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true }
    },
    summary: {
        total_assessments: { type: Number, default: 0 },
        average_mood_score: { type: Number, default: 0 },
        average_stress_level: { type: Number, default: 0 },
        predicted_disorder_distribution: { type: Map, of: Number },
        urgency_level_distribution: { type: Map, of: Number },
        therapy_suggestions: { type: Map, of: Number }
    },
    assessment_data: [{
        assessment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
        patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
        assessment_date: Date,
        symptoms: String,
        duration_weeks: Number,
        previous_diagnosis: String,
        therapy_history: String,
        medication: String,
        mood_score: Number,
        stress_level: Number,
        predicted_disorder: String,
        urgency_level: String,
        suggested_therapy: String,
        self_care_advice: String,
        confidence_score: Number
    }],
    report_name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);