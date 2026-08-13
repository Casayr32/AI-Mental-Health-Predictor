const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    sender_role: {
        type: String,
        enum: ['patient', 'doctor'],
        required: true
    }, // WAA FIELD-KA XALLINAYA DHIBATADA
    message_text: { type: String, required: true },
    sent_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);