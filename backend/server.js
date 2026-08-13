const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoutes');


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
connectDB();

// --- API ROUTES ---
// Auth Routes (Login, Register)
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/reports', reportRoutes);


// Admin Routes (Dashboard, Manage Users)
app.use('/api/admin', require('./routes/adminRoutes'));

// Patient Routes (Appointments, Medical History, Assessments)
app.use('/api/patient', require('./routes/patientRoutes'));

// Doctor Routes (Schedule, Patient Consultations, Prescriptions)
app.use('/api/doctor', require('./routes/doctorRoutes'));

// Simple test route to verify backend status
app.get('/api/test', (req, res) => {
    res.json({ message: "MindCare AI Backend is running successfully!" });
});

// Root route
app.get('/', (req, res) => {
    res.send("MindCare AI API Service is Active");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});