const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// ✅ Halkan ku beddel 'authController' maadaama shaqooyinka oo dhan ay authController ku jiraan
const {
    getMyPatients,
    getPatientDetails,
    getMyAlerts,
    getMyAssessments,
    updateAlertStatus,
    sendMessage,
    getChatHistory
} = require('../controllers/authController');

// All doctor routes require login
router.use(protect);

router.get('/patients', getMyPatients);
router.get('/patients/:id', getPatientDetails);
router.get('/alerts', getMyAlerts);
router.get('/assessments', getMyAssessments);
router.put('/alerts/:id', updateAlertStatus);
router.post('/messages', sendMessage);
router.get('/messages/:patientId', getChatHistory);

module.exports = router;