const express = require('express');
const router = express.Router();
const { registerPatient, registerDoctor, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register-patient', registerPatient);
router.post('/register-doctor', registerDoctor);
router.post('/login', loginUser);

// Forgot Password Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;