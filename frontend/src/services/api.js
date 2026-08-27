import axios from 'axios';

const API = axios.create({
    // SAX: Waxaa lagu daray https:// iyo /api ee dhamaadka
    baseURL: 'https://ai-mental-health-predictor-production-46e0.up.railway.app/api'
});

// REQUEST INTERCEPTOR
API.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('token');
        if (!token) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                token = user?.token || user?.accessToken;
            } catch (err) {
                token = null;
            }
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR - SAFE LOGOUT
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("401 detected - Safe logout triggered");
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            if (window.location.pathname !== '/login') {
                window.dispatchEvent(new Event('logout'));
            }
        }
        return Promise.reject(error);
    }
);

// --- AUTH ROUTES ---
export const loginUser = (data) => API.post('/auth/login', data);
export const registerPatient = (data) => API.post('/auth/register-patient', data);
export const registerDoctor = (data) => API.post('/auth/register-doctor', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => API.post('/auth/reset-password', { token, newPassword });

// --- PATIENT ROUTES ---
export const submitAssessment = (data) => API.post('/patient/assessments', data);
export const assignDoctor = (doctor_id) => API.post('/patient/assign-doctor', { doctor_id });
export const getAvailableDoctors = () => API.get('/patient/available-doctors');
export const getPatientHistory = () => API.get('/patient/history');
export const getPatientFeedback = () => API.get('/patient/feedback');
export const getPatientMessages = () => API.get('/patient/messages');
export const sendPatientMessage = (data) => API.post('/patient/messages', data);
export const getMyProfile = () => API.get('/patient/profile');

// --- DOCTOR ROUTES ---
export const getDoctorPatients = () => API.get('/doctor/patients');
export const getPatientDetails = (id) => API.get(`/doctor/patients/${id}`);
export const getDoctorAlerts = () => API.get('/doctor/alerts');
export const getDoctorAssessments = () => API.get('/doctor/assessments');
export const updateAlertStatus = (id, status) => API.put(`/doctor/alerts/${id}`, { status });
export const sendDoctorMessage = (data) => API.post('/doctor/messages', data);
export const getChatHistory = (patientId) => API.get(`/doctor/messages/${patientId}`);

// --- ADMIN ROUTES ---
export const adminGetDoctors = () => API.get('/admin/doctors');
export const adminCreateDoctor = (data) => API.post('/admin/doctors', data);
export const adminUpdateDoctor = (id, data) => API.put(`/admin/doctors/${id}`, data);
export const adminUpdateDoctorStatus = (id, status) => API.put(`/admin/doctors/${id}/status`, { status });
export const adminDeleteDoctor = (id) => API.delete(`/admin/doctors/${id}`);

export const adminGetPatients = () => API.get('/admin/patients');
export const adminCreatePatient = (data) => API.post('/admin/patients', data);
export const adminUpdatePatient = (id, data) => API.put(`/admin/patients/${id}`, data);
export const adminUpdatePatientStatus = (id, status) => API.put(`/admin/patients/${id}/status`, { status });
export const adminDeletePatient = (id) => API.delete(`/admin/patients/${id}`);

export default API;
