// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/authMiddleware');
// const {
//     submitAssessment,
//     getMyHistory,
//     getMyFeedback,
//     getMyMessages,
//     sendMessageToDoctor,
//     assignDoctor,
//     getAvailableDoctors,
//     getMyProfile
// } = require('../controllers/patientController');

// // All patient routes are protected with JWT auth middleware
// router.use(protect);

// // Assessment Routes
// router.post('/assessments', submitAssessment);
// router.get('/history', getMyHistory);
// router.get('/feedback', getMyFeedback);

// // Doctor Assignment & Discovery Routes
// router.post('/assign-doctor', assignDoctor);
// router.get('/available-doctors', getAvailableDoctors);

// // Secure Messaging Routes
// router.get('/messages', getMyMessages);
// router.post('/messages', sendMessageToDoctor);

// // Profile & Doctor history route
// router.get('/profile', getMyProfile);

// //new one down
// router.put('/messages/mark-read', protect, markMyMessagesAsRead);

// module.exports = router;



const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    submitAssessment,
    getMyHistory,
    getMyFeedback,
    getMyMessages,
    sendMessageToDoctor,
    assignDoctor,
    getAvailableDoctors,
    getMyProfile
} = require('../controllers/patientController');

// All patient routes are protected with JWT auth middleware
router.use(protect);

// Assessment Routes
router.post('/assessments', submitAssessment);
router.get('/history', getMyHistory);
router.get('/feedback', getMyFeedback);

// Doctor Assignment & Discovery Routes
router.post('/assign-doctor', assignDoctor);
router.get('/available-doctors', getAvailableDoctors);

// Secure Messaging Routes
router.get('/messages', getMyMessages);
router.post('/messages', sendMessageToDoctor);

// Profile & Doctor history route
router.get('/profile', getMyProfile);

module.exports = router;