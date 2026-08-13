const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    assessment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    status: {
        type: String,
        required: true,
        default: 'Pending',
        enum: ['Pending', 'Acknowledged', 'Resolved']
    },
    created_at: { type: Date, default: Date.now },
    resolved_at: { type: Date, default: null }
});

module.exports = mongoose.model('Alert', AlertSchema);