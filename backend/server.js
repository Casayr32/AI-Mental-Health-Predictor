const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// --- CORS CONFIGURATION (VERCEL & RAILWAY FIX) ---
const allowedOrigins = [
    'https://ai-mental-health-predictor-hazel.vercel.app',
    'https://ai-mental-health-predictor-production-41f0.up.railway.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Ogolow requests-ka ka imaanaya origins-ka la fasaxay ama kuwa aan origin lahayn (sida Postman)
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middlewares
app.use(express.json());

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
