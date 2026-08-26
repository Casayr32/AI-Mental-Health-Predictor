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

// SAX: CORS configuration buuxa oo fasaxaya dhammaan domain-yada iyo headers-ka
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to MongoDB Atlas
connectDB();

// --- API ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', reportRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));

// Simple test route
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
