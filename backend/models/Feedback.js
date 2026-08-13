const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    assessment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    feedback_text: { type: String, required: true },
    generated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);