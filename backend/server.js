const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoutes');
const path = require('path'); // <--- ADDED

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// --- CORS CONFIGURATION ---
const allowedOrigins = [
    'https://ai-mental-health-predictor-hazel.vercel.app',
    'https://ai-mental-health-predictor-production-41f0.up.railway.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
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

// ==========================================
// ADDED: SERVE REACT FRONTEND FROM NODE.JS
// ==========================================
// Serve the static files from the Vite build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// For any route that isn't an API route, send the React index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Full-stack server running on port ${PORT}`);
});
