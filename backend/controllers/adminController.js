const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');

// ==========================================
// DOCTOR MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password_hash');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a doctor directly (Admin action)
exports.createDoctor = async (req, res) => {
    try {
        const { first_name, mid_name, last_name, email, password, specialisation } = req.body;

        const doctorExists = await Doctor.findOne({ email });
        if (doctorExists) return res.status(400).json({ message: 'Doctor already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const doctor = await Doctor.create({
            first_name, mid_name, last_name, email, password_hash, specialisation,
            account_status: 'Active'
        });

        res.status(201).json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update doctor info
exports.updateDoctorInfo = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        Object.assign(doctor, req.body);
        await doctor.save();
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update doctor status (Approve, Reject, Suspend)
exports.updateDoctorStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        doctor.account_status = status;
        await doctor.save();
        res.json({ message: 'Doctor status updated', doctor });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete doctor
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        await doctor.deleteOne();
        res.json({ message: 'Doctor removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// ==========================================
// PATIENT MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Get all patients
exports.getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find().select('-password_hash').populate('assigned_doctor', 'first_name last_name');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a patient directly (Admin action)
exports.createPatient = async (req, res) => {
    try {
        const { first_name, mid_name, last_name, email, password } = req.body;

        const patientExists = await Patient.findOne({ email });
        if (patientExists) return res.status(400).json({ message: 'Patient already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const patient = await Patient.create({
            first_name, mid_name, last_name, email, password_hash,
            status: 'Active'
        });

        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update patient info
exports.updatePatientInfo = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        Object.assign(patient, req.body);
        await patient.save();
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update patient status
exports.updatePatientStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        patient.status = status;
        await patient.save();
        res.json({ message: 'Patient status updated', patient });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete patient
exports.deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        await patient.deleteOne();
        res.json({ message: 'Patient removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};