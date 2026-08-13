const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- MODEL IMPORTS ---
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');
const Message = require('../models/Message');

// --- HELPER CONFIG & FUNCTIONS ---
const algorithm = 'aes-256-cbc';
const jwtSecret = process.env.JWT_SECRET || 'default_fallback_jwt_secret_key_32bytes';
const key = jwtSecret.padEnd(32, '0').slice(0, 32);

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '30d' });
};

// =======================================================
//                   AUTH FUNCTIONS
// =======================================================

// @desc    Register a new Patient (No doctor assigned yet)
exports.registerPatient = async (req, res) => {
    try {
        const { first_name, mid_name, last_name, email, password } = req.body;

        const patientExists = await Patient.findOne({ email });
        if (patientExists) return res.status(400).json({ message: 'Patient already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const patient = await Patient.create({
            first_name,
            mid_name,
            last_name,
            email,
            password_hash,
            assigned_doctor: null
        });

        res.status(201).json({
            _id: patient._id,
            role: 'Patient',
            token: generateToken(patient._id, 'Patient'),
            assigned_doctor: null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Register a new Doctor (Starts as Pending)
exports.registerDoctor = async (req, res) => {
    try {
        const { first_name, mid_name, last_name, email, password, specialisation } = req.body;

        const doctorExists = await Doctor.findOne({ email });
        if (doctorExists) return res.status(400).json({ message: 'Doctor already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const doctor = await Doctor.create({
            first_name,
            mid_name,
            last_name,
            email,
            password_hash,
            specialisation,
            account_status: 'Pending'
        });

        res.status(201).json({
            message: 'Doctor registration successful. Awaiting Admin approval.',
            _id: doctor._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Login for any role (Admin, Doctor, Patient)
exports.loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let user;

        if (role === 'Admin') user = await Admin.findOne({ email });
        else if (role === 'Doctor') user = await Doctor.findOne({ email });
        else if (role === 'Patient') user = await Patient.findOne({ email });
        else return res.status(400).json({ message: 'Invalid role specified' });

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const statusField = user.account_status || user.status;
        if (statusField && statusField !== 'Active' && statusField !== 'Approved') {
            return res.status(403).json({
                message: `Access denied. Your account is currently: ${statusField}`
            });
        }

        res.json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            role: role,
            token: generateToken(user._id, role),
            assigned_doctor: user.assigned_doctor || null
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Forgot Password (Generates 6-Digit OTP Code & sends Gmail)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Search across Patient, Doctor, and Admin
        let user = await Patient.findOne({ email });
        let userRole = 'Patient';

        if (!user) {
            user = await Doctor.findOne({ email });
            userRole = 'Doctor';
        }
        if (!user) {
            user = await Admin.findOne({ email });
            userRole = 'Admin';
        }

        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address' });
        }

        // Generate 6-Digit Verification Code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save Code & Expiration (10 minutes)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        // Create Email Transporter using .env variables
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
            }
        });

        // Clean & Deliverable Email Template (No external links)
        const mailOptions = {
            from: `"MindCare Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Code - Mental Healthcare System',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset Code</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f7fa; padding: 20px; }
                        .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; text-align: center; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
                        .content { padding: 30px; text-align: center; }
                        .code-box { background-color: #f0f4ff; border: 2px dashed #667eea; border-radius: 8px; padding: 15px; margin: 20px 0; display: inline-block; width: 80%; }
                        .code { font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin: 0; }
                        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 13px; }
                        .warning { color: #e53e3e; font-size: 14px; font-weight: 500; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p style="text-align: left;">Hello <strong>${user.first_name || userRole}</strong>,</p>
                            <p style="text-align: left;">You requested to reset your password for your <strong>${userRole}</strong> account. Use the verification code below to complete the reset:</p>
                            
                            <div class="code-box">
                                <p class="code">${resetCode}</p>
                            </div>

                            <p class="warning">⏱️ This code will expire in 10 minutes.</p>
                            <p style="text-align: left; color: #718096; font-size: 13px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Mental Healthcare System. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            message: 'Verification code sent to your email successfully!',
            email: email
        });

    } catch (error) {
        console.error('Error sending password reset email:', error);
        return res.status(500).json({
            message: 'Server Error: Failed to send verification code.',
            error: error.message
        });
    }
};

// @desc    Reset Password with 6-Digit Code
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body; // 'token' here is the 6-digit code sent by frontend

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Code and new password are required' });
        }

        // Find user across models matching code and unexpired time
        let user = await Patient.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } }) ||
            await Doctor.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } }) ||
            await Admin.findOne({ resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(newPassword, salt);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// =======================================================
//                   DOCTOR FUNCTIONS
// =======================================================

// @desc    Get Doctor's Assigned Patients
exports.getMyPatients = async (req, res) => {
    try {
        const patients = await Patient.find({ assigned_doctor: req.user._id }).select('-password_hash');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Specific Patient Details & FULL Assessment History
exports.getPatientDetails = async (req, res) => {
    try {
        const patient = await Patient.findOne({ _id: req.params.id, assigned_doctor: req.user._id }).select('-password_hash');
        if (!patient) return res.status(404).json({ message: 'Patient not found or not assigned to you' });

        const assessments = await Assessment.find({ patient_id: patient._id }).sort({ created_at: -1 });
        res.json({ patient, assessments });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Doctor's Alerts
exports.getMyAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ doctor_id: req.user._id })
            .populate({ path: 'assessment_id', populate: { path: 'patient_id', select: '-password_hash' } })
            .sort({ created_at: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Doctor's Assessments for Analytics
exports.getMyAssessments = async (req, res) => {
    try {
        const patients = await Patient.find({ assigned_doctor: req.user._id }).select('_id');
        const patientIds = patients.map(p => p._id);

        const assessments = await Assessment.find({
            patient_id: { $in: patientIds }
        }).sort({ created_at: -1 });

        res.json(assessments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update Alert Status
exports.updateAlertStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const alert = await Alert.findById(req.params.id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        alert.status = status;
        if (status === 'Resolved') alert.resolved_at = new Date();
        await alert.save();

        res.json({ message: 'Alert updated', alert });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Send Secure Message to Patient
exports.sendMessage = async (req, res) => {
    try {
        const { patient_id, message_text } = req.body;

        const patient = await Patient.findOne({ _id: patient_id, assigned_doctor: req.user._id });
        if (!patient) return res.status(403).json({ message: 'Not authorized to message this patient' });

        if (!message_text || !message_text.trim()) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(message_text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedMessage = iv.toString('hex') + ':' + encrypted;

        const message = await Message.create({
            doctor_id: req.user._id,
            patient_id: patient_id,
            message_text: encryptedMessage,
            sender_role: 'doctor'
        });

        res.status(201).json({
            ...message._doc,
            message_text: message_text,
            sender_role: 'doctor'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Chat History with Patient
exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find({
            doctor_id: req.user._id,
            patient_id: req.params.patientId
        }).sort({ sent_at: 1 });

        const decryptedMessages = messages.map(msg => {
            let decryptedText = msg.message_text;
            try {
                const textParts = msg.message_text.split(':');
                if (textParts.length >= 2) {
                    const iv = Buffer.from(textParts.shift(), 'hex');
                    const encryptedText = textParts.join(':');
                    const decipher = crypto.createDecipheriv(algorithm, key, iv);
                    decryptedText = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
                }
            } catch (err) {
                decryptedText = msg.message_text;
            }

            const rawRole = (msg.sender_role || '').toString().toLowerCase();
            let resolvedRole = 'doctor';

            if (rawRole === 'patient' || rawRole === 'user') {
                resolvedRole = 'patient';
            } else if (rawRole === 'doctor') {
                resolvedRole = 'doctor';
            }

            return {
                ...msg._doc,
                message_text: decryptedText,
                sender_role: resolvedRole
            };
        });

        res.json(decryptedMessages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};