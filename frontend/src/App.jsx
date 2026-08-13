import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';

// Import all pages
import PatientDashboard from './pages/PatientDashboard';
import PatientAssess from './pages/PatientAssess';
import PatientResult from './pages/PatientResult';
import PatientResults from './pages/PatientResults';
import PatientHistory from './pages/PatientHistory';
import PatientMessages from './pages/PatientMessages';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAlerts from './pages/DoctorAlerts';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import DoctorMessages from './pages/DoctorMessages';
import AdminDashboard from './pages/AdminDashboard';

import DoctorReports from './pages/DoctorReports';
import DoctorPatientReport from './pages/DoctorPatientReport';
import ChatbotDebug from './pages/ChatbotDebug';

// Bulletproof lower helper
const toLower = (val) => {
  try {
    return String(val ?? '').toLowerCase();
  } catch {
    return '';
  }
};

// Extract role from user object
const extractRole = (user) => {
  if (!user || typeof user !== 'object') return '';
  return toLower(
    user.role ||
    user.user_type ||
    user.userType ||
    user.account_type ||
    user.accountType ||
    user.type ||
    ''
  );
};

// Toast Helper
export const toast = (msg, type = 'info') => {
  const box = document.getElementById('toastBox');
  if (!box) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="ti ti-${type === 'success' ? 'check' : type === 'error' ? 'x' : 'info-circle'}"></i> ${msg}`;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, 3000);
};

// Route Protection Wrapper
const ProtectRoute = ({ children, role, user }) => {
  if (!user || typeof user !== 'object') {
    return <Navigate to="/login" replace />;
  }

  const currentUserRole = extractRole(user);
  const requiredRole = toLower(role || '');

  if (!currentUserRole) {
    console.warn('[ProtectRoute] No role found on user object. Keys:', Object.keys(user));
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUserRole !== requiredRole) {
    return <Navigate to={`/${currentUserRole}/dashboard`} replace />;
  }

  return children;
};

// Validate stored user
const loadSavedUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

function App() {
  const [user, setUser] = useState(loadSavedUser);

  // ===== LOGOUT LISTENER =====
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
    };

    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);

  // ===== MOBILE SIDEBAR TOGGLE =====
  useEffect(() => {
    let currentHam = null;
    let currentSidebar = null;
    let currentOv = null;
    let observer = null;

    const closeSidebar = () => {
      if (currentSidebar) currentSidebar.classList.remove('open');
      if (currentOv) currentOv.classList.remove('open');
      document.body.style.overflow = '';
    };

    const openSidebar = () => {
      if (currentSidebar) currentSidebar.classList.add('open');
      if (currentOv) currentOv.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const toggleSidebar = () => {
      if (currentSidebar && currentSidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    };

    const attachListeners = () => {
      const ham = document.querySelector('.ham');
      const sidebar = document.querySelector('.sidebar');
      const ov = document.querySelector('.sb-ov');

      if (!ham || !sidebar) return false;

      // Skip if already attached to same elements
      if (ham === currentHam && sidebar === currentSidebar) return true;

      // Clean up old listeners
      if (currentHam) currentHam.removeEventListener('click', toggleSidebar);
      if (currentOv) currentOv.removeEventListener('click', closeSidebar);
      if (currentSidebar) {
        currentSidebar.querySelectorAll('.sb-item').forEach(item => {
          item.removeEventListener('click', closeSidebar);
        });
      }

      currentHam = ham;
      currentSidebar = sidebar;
      currentOv = ov;

      ham.addEventListener('click', toggleSidebar);

      if (ov) ov.addEventListener('click', closeSidebar);

      sidebar.querySelectorAll('.sb-item').forEach(item => {
        item.addEventListener('click', closeSidebar);
      });

      return true;
    };

    // Try immediately
    attachListeners();

    // Watch for DOM changes (React Router mounts pages dynamically)
    observer = new MutationObserver(() => {
      attachListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Close on Escape
    const onKey = (e) => {
      if (e.key === 'Escape') closeSidebar();
    };
    document.addEventListener('keydown', onKey);

    // Close on resize to desktop
    const onResize = () => {
      if (window.innerWidth > 768) closeSidebar();
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (currentHam) currentHam.removeEventListener('click', toggleSidebar);
      if (currentOv) currentOv.removeEventListener('click', closeSidebar);
      if (currentSidebar) {
        currentSidebar.querySelectorAll('.sb-item').forEach(item => {
          item.removeEventListener('click', closeSidebar);
        });
      }
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
      closeSidebar();
    };
  }, []);

  const getSafeDashboardPath = () => {
    if (!user || typeof user !== 'object') return '/login';
    const role = extractRole(user);
    if (!role) return '/login';
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <>
      <div id="toastBox"></div>

      <div
        className="modal-ov"
        id="modalOv"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.target.classList.remove('open');
        }}
      >
        <div className="modal-box" id="modalBox"></div>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to={getSafeDashboardPath()} replace />} />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getSafeDashboardPath()} replace />
            ) : (
              <Login setUser={setUser} />
            )
          }
        />

        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<ProtectRoute role="Patient" user={user}><PatientDashboard /></ProtectRoute>} />
        <Route path="/patient/assess" element={<ProtectRoute role="Patient" user={user}><PatientAssess /></ProtectRoute>} />
        <Route path="/patient/result" element={<ProtectRoute role="Patient" user={user}><PatientResult /></ProtectRoute>} />
        <Route path="/patient/results" element={<ProtectRoute role="Patient" user={user}><PatientResults /></ProtectRoute>} />
        <Route path="/patient/history" element={<ProtectRoute role="Patient" user={user}><PatientHistory /></ProtectRoute>} />
        <Route path="/patient/messages" element={<ProtectRoute role="Patient" user={user}><PatientMessages /></ProtectRoute>} />
        <Route path="/patient/chatbot-debug" element={<ProtectRoute role="Patient" user={user}><ChatbotDebug /></ProtectRoute>} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<ProtectRoute role="Doctor" user={user}><DoctorDashboard /></ProtectRoute>} />
        <Route path="/doctor/alerts" element={<ProtectRoute role="Doctor" user={user}><DoctorAlerts /></ProtectRoute>} />
        <Route path="/doctor/patient/:id" element={<ProtectRoute role="Doctor" user={user}><DoctorPatientDetail /></ProtectRoute>} />
        <Route path="/doctor/messages" element={<ProtectRoute role="Doctor" user={user}><DoctorMessages /></ProtectRoute>} />
        <Route path="/doctor-reports" element={<ProtectRoute role="Doctor" user={user}><DoctorReports /></ProtectRoute>} />
        <Route path="/doctor-reports/:reportId" element={<ProtectRoute role="Doctor" user={user}><DoctorPatientReport /></ProtectRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectRoute role="Admin" user={user}><AdminDashboard /></ProtectRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;