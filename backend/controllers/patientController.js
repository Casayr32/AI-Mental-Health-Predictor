const crypto = require('crypto');
const Assessment = require('../models/Assessment');
const Feedback = require('../models/Feedback');
const Alert = require('../models/Alert');
const Message = require('../models/Message');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const algorithm = 'aes-256-cbc';
const jwtSecret = process.env.JWT_SECRET || 'default_fallback_jwt_secret_key_32bytes';
const key = jwtSecret.padEnd(32, '0').slice(0, 32);

// @desc    Submit new assessment
exports.submitAssessment = async (req, res) => {
    try {
        const patientId = req.user._id;
        const { q1_symptoms, q2_duration_weeks, q3_previous_diagnosis, q4_therapy_history, q5_medication, q6_mood, q7_stress_level } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(444).json({ message: 'Patient profile not found.' });
        }

        if (patient.lastCheckIn) {
            const now = new Date();
            const diffInHours = (now - patient.lastCheckIn) / (1000 * 60 * 60);
            if (diffInHours < 48) {
                return res.status(403).json({ message: 'You can only take an assessment once every 48 hours.' });
            }
        }

        // Halkan waxaa lagu isticmaalayaa Render URL-kaaga cusub iyadoo laga duulayo environment variable ama lagu xirayo si toos ah
        // const aiModelUrl = process.env.AI_MODEL_URL || 'https://ai-mental-health-predictor-2.onrender.com/predict';
        // const aiModelUrl = process.env.AI_SERVICE_URL || 'https://ai-mental-health-predictor-production-c0d3.up.railway.app/predict';
        //const aiModelUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
        const aiModelUrl = 'http://127.0.0.1:5001/predict';


        const aiResponse = await fetch(aiModelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q1_symptoms, q2_duration_weeks, q3_previous_diagnosis, q4_therapy_history, q5_medication, q6_mood, q7_stress_level })
        });

        if (!aiResponse.ok) {
            throw new Error(`AI Model connection error: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();

        if (aiData.error) {
            return res.status(500).json({ message: 'AI Processing Error', error: aiData.error });
        }

        const predictedDisorder = aiData.predicted_disorder || aiData.predicted_condition;
        const urgencyLevel = aiData.urgency_level;
        const suggestedTherapy = aiData.suggested_therapy;
        const selfCareAdvice = aiData.self_care_advice || aiData['self-care_advice'];
        const confidenceScore = aiData.confidence_score;

        const assessment = await Assessment.create({
            patient_id: patientId,
            q1_symptoms,
            q2_duration_weeks,
            q3_previous_diagnosis,
            q4_therapy_history,
            q5_medication,
            q6_mood,
            q7_stress_level,
            predicted_disorder: predictedDisorder,
            urgency_level: urgencyLevel,
            suggested_therapy: suggestedTherapy,
            self_care_advice: selfCareAdvice,
            confidence_score: confidenceScore
        });

        patient.lastCheckIn = new Date();
        await patient.save();

        let feedbackText = "Thank you for completing your assessment. ";
        if (urgencyLevel === 'Critical') {
            feedbackText += "Our system has detected a critical level of distress. Please select a doctor below so we can connect you with help immediately.";
        } else if (urgencyLevel === 'High') {
            feedbackText += "Your results indicate a high level of concern. Please select a doctor below to notify them.";
        } else {
            feedbackText += `Based on your responses, it looks like you may be experiencing some ${predictedDisorder ? predictedDisorder.toLowerCase() : 'distress'}. Please select a doctor to review your results and guide your next steps.`;
        }

        await Feedback.create({
            assessment_id: assessment._id,
            feedback_text: feedbackText
        });

        if ((urgencyLevel === 'High' || urgencyLevel === 'Critical') && patient.assigned_doctor) {
            await Alert.create({
                assessment_id: assessment._id,
                doctor_id: patient.assigned_doctor,
                status: 'Pending'
            });
        }

        return res.status(201).json({
            message: 'Assessment completed successfully',
            assessment,
            feedback: feedbackText,
            needs_doctor: !patient.assigned_doctor
        });

    } catch (error) {
        console.error("❌ ASSESSMENT SUBMIT ERROR:", error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Assign a doctor to patient
exports.assignDoctor = async (req, res) => {
    try {
        const { doctor_id } = req.body;
        const patient = await Patient.findById(req.user._id);

        if (patient.assigned_doctor && patient.assigned_doctor.toString() !== doctor_id) {
            patient.doctor_history.push({
                doctor_id: patient.assigned_doctor,
                assigned_at: patient.lastCheckIn || new Date(),
                unassigned_at: new Date()
            });
        }

        patient.assigned_doctor = doctor_id;
        await patient.save();

        const latestAssessment = await Assessment.findOne({ patient_id: req.user._id }).sort({ created_at: -1 });
        if (latestAssessment && (latestAssessment.urgency_level === 'High' || latestAssessment.urgency_level === 'Critical')) {
            await Alert.create({
                assessment_id: latestAssessment._id,
                doctor_id: doctor_id,
                status: 'Pending'
            });
        }

        res.json({ message: 'Doctor assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get patient assessment history
exports.getMyHistory = async (req, res) => {
    try {
        const assessments = await Assessment.find({ patient_id: req.user._id }).sort({ created_at: -1 });
        res.json(assessments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get patient feedbacks
exports.getMyFeedback = async (req, res) => {
    try {
        const assessments = await Assessment.find({ patient_id: req.user._id }).select('_id');
        const assessmentIds = assessments.map(a => a._id);
        const feedbacks = await Feedback.find({ assessment_id: { $in: assessmentIds } }).populate('assessment_id');
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Patient's Messages & Assigned Doctor Info
exports.getMyMessages = async (req, res) => {
    try {
        const patientId = req.user._id;

        const patient = await Patient.findById(patientId)
            .populate('assigned_doctor', 'first_name last_name specialisation email');

        const messages = await Message.find({ patient_id: patientId }).sort({ sent_at: 1 });

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

            // --- RESOLVE SENDER ROLE ACCURATELY ---
            const rawRole = (msg.sender_role || '').toString().toLowerCase();
            let resolvedRole = 'patient';

            if (rawRole === 'doctor') {
                resolvedRole = 'doctor';
            } else if (rawRole === 'patient' || rawRole === 'user') {
                resolvedRole = 'patient';
            } else if (msg.doctor_id && msg.doctor_id.toString() === patientId.toString()) {
                resolvedRole = 'doctor';
            }

            return {
                ...msg._doc,
                message_text: decryptedText,
                sender_role: resolvedRole
            };
        });

        res.json({
            assigned_doctor: patient?.assigned_doctor || null,
            messages: decryptedMessages
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get list of Active doctors
exports.getAvailableDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ account_status: { $in: ['Approved', 'Active'] } }).select('-password_hash');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Patient Profile
exports.getMyProfile = async (req, res) => {
    try {
        const patient = await Patient.findById(req.user._id)
            .select('-password_hash')
            .populate('assigned_doctor', 'first_name last_name specialisation');

        await patient.populate('doctor_history.doctor_id', 'first_name last_name specialisation');

        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Send Secure Message to Doctor
exports.sendMessageToDoctor = async (req, res) => {
    try {
        const patient = await Patient.findById(req.user._id);
        if (!patient || !patient.assigned_doctor) {
            return res.status(400).json({ message: 'You must be assigned a doctor to send messages.' });
        }

        const { message_text } = req.body;
        if (!message_text || !message_text.trim()) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(message_text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedMessage = iv.toString('hex') + ':' + encrypted;

        const newMessage = await Message.create({
            doctor_id: patient.assigned_doctor,
            patient_id: req.user._id,
            message_text: encryptedMessage,
            sender_role: 'patient'
        });

        res.status(201).json({
            ...newMessage._doc,
            message_text: message_text,
            sender_role: 'patient'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
