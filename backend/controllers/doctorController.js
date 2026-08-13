const Patient = require('../models/Patient');
const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');
const Message = require('../models/Message');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const jwtSecret = process.env.JWT_SECRET || 'default_fallback_jwt_secret_key_32bytes';
const key = jwtSecret.padEnd(32, '0').slice(0, 32);

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

            // --- RESOLVE SENDER ROLE ACCURATELY FOR DOCTOR VIEW ---
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