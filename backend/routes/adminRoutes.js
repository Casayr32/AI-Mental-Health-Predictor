const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    getAllDoctors, createDoctor, updateDoctorInfo, updateDoctorStatus, deleteDoctor,
    getAllPatients, createPatient, updatePatientInfo, updatePatientStatus, deletePatient
} = require('../controllers/adminController');

// All routes below require Admin authentication
router.use(protect, adminOnly);

// Doctor Management Routes
router.route('/doctors').get(getAllDoctors).post(createDoctor);
router.route('/doctors/:id')
    .put(updateDoctorInfo)        // Edit info
    .delete(deleteDoctor);        // Permanent delete
router.put('/doctors/:id/status', updateDoctorStatus); // Approve, Reject, Suspend, etc.

// Patient Management Routes
router.route('/patients').get(getAllPatients).post(createPatient);
router.route('/patients/:id')
    .put(updatePatientInfo)       // Edit info
    .delete(deletePatient);       // Permanent delete
router.put('/patients/:id/status', updatePatientStatus); // Suspend, Deactivate, etc.

module.exports = router;