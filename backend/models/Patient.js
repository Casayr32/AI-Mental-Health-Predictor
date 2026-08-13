const mongoose = require('mongoose');

// Sub-schema to correctly handle the history array and dates
const DoctorHistorySchema = new mongoose.Schema({
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    assigned_at: { type: Date, default: Date.now() },
    unassigned_at: { type: Date, default: null }
});

const PatientSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    mid_name: { type: String },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },

    // Doctor Assignment Workflow Update
    assigned_doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        default: null
    },
    doctor_history: [DoctorHistorySchema], // Fixed sub-schema for proper date tracking

    lastCheckIn: { type: Date, default: null },

    // Strict Status Management per new rules
    status: {
        type: String,
        required: true,
        default: 'Active',
        enum: ['Active', 'Suspended', 'Deactivated']
    },

    // Password Reset Fields
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);