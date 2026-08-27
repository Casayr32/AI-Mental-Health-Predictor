// const express = require('express');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const reportRoutes = require('./routes/reportRoutes');

// dotenv.config();
// const app = express();

// // ==========================================
// // NUCLEAR CORS FIX: Manually intercept OPTIONS
// // ==========================================
// app.use((req, res, next) => {
//     // Allow your Vercel frontend (and anything else for now)
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
//     res.header('Access-Control-Allow-Credentials', 'true');

//     // If the browser sends an OPTIONS preflight check, reply with 200 OK immediately and stop.
//     if (req.method === 'OPTIONS') {
//         return res.status(200).end();
//     }

//     // If it's a normal GET/POST/PUT/DELETE, continue to the routes
//     next();
// });

// app.use(express.json());

// // Connect to MongoDB Atlas
// connectDB();

// // --- API ROUTES ---
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/reports', reportRoutes);
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/patient', require('./routes/patientRoutes'));
// app.use('/api/doctor', require('./routes/doctorRoutes'));

// app.get('/api/test', (req, res) => {
//     res.json({ message: "MindCare AI Backend is running successfully!" });
// });

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //     console.log(`Node.js Backend running on port ${PORT}`);
// // });
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//     console.log(`Node.js Backend running on port ${PORT}`);
// });



const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();
const app = express();

// ==========================================
// ROBUST CORS CONFIGURATION
// ==========================================
app.use(cors({
    origin: '*', // Ama waxaad geli kartaa domain-kaaga Vercel haddii aad rabto
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));

app.use(express.json());

// Connect to MongoDB Atlas
connectDB();

// --- API ROUTES (Halkan ayay ka maqnaayeen koodkaagii dambe) ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', reportRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));

// Diagnostic route
app.get('/api/test', (req, res) => {
    res.json({ message: "MindCare AI Backend is running successfully!" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Node.js Backend running on port ${PORT}`);
});
