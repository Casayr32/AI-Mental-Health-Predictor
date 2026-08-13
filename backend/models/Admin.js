const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    mid_name: { type: String },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, default: 'Admin' }, // Explicitly locking this collection to Admin role

    // Reset Password Fields
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);