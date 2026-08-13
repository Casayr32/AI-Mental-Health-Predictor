const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Middleware to verify JWT token for any logged-in user
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request based on role in token
            if (decoded.role === 'Admin') req.user = await Admin.findById(decoded.id).select('-password_hash');
            else if (decoded.role === 'Doctor') req.user = await Doctor.findById(decoded.id).select('-password_hash');
            else if (decoded.role === 'Patient') req.user = await Patient.findById(decoded.id).select('-password_hash');
            else return res.status(401).json({ message: 'Invalid token role' });

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

// Middleware strictly for Admins (Enforces FR-7 at API level)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
};

module.exports = { protect, adminOnly };