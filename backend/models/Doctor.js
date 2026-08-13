const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    mid_name: { type: String },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    specialisation: { type: String, required: true },

    // FR-7: Admin Account Management Status
    account_status: {
        type: String,
        required: true,
        default: 'Pending', // New registrations start here
        enum: [
            'Pending',      // Awaiting Admin review
            'Approved',     // Registration accepted by Admin
            'Rejected',     // Registration denied by Admin
            'Active',       // Fully functioning account
            'Suspended',    // Temporarily restricted by Admin
            'Deactivated',  // Soft-deactivated by Admin
            'Removed'       // Taken out of active system by Admin
        ]
    },

    // Reset Password Fields
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);