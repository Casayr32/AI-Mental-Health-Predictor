import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerPatient, registerDoctor, forgotPassword, resetPassword } from '../services/api';

// Toast helper (DOM fallback)
const toast = (msg, type = 'info') => {
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

export default function Login({ setUser }) {
    const navigate = useNavigate();

    // Auth States
    const [role, setRole] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [fName, setFName] = useState('');
    const [mName, setMName] = useState('');
    const [lName, setLName] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [specialisation, setSpecialisation] = useState('');

    // Forgot Password States
    const [isForgotPass, setIsForgotPass] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetToken, setResetToken] = useState('');
    const [newPass, setNewPass] = useState('');

    // Helper: clear all inputs
    const clearAllInputs = () => {
        setEmail('');
        setPassword('');
        setFName('');
        setMName('');
        setLName('');
        setConfirmPass('');
        setSpecialisation('');
        setResetToken('');
        setNewPass('');
    };

    // Helper: map frontend role to backend role name
    const getBackendRole = (r) => {
        if (r === 'admin') return 'Admin';
        if (r === 'clinician') return 'Doctor';
        return 'Patient';
    };

    // Helper: map backend role to frontend route prefix
    const getRoutePrefix = (r) => {
        if (r === 'Admin') return 'admin';
        if (r === 'Doctor') return 'doctor';
        return 'patient';
    };

    // Save token in BOTH user object AND dedicated slot
    const saveAuthData = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.token) {
            localStorage.setItem('token', userData.token);
        }
        setUser(userData);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        if (isRegistering && password !== confirmPass) {
            return toast('Passwords do not match', 'error');
        }

        try {
            let res;
            const backendRole = getBackendRole(role);

            if (isRegistering) {
                if (role === 'patient') {
                    res = await registerPatient({ first_name: fName, mid_name: mName, last_name: lName, email, password });

                    const userData = {
                        ...(res.data || {}),
                        role: backendRole,
                        first_name: fName,
                        mid_name: mName,
                        last_name: lName
                    };
                    saveAuthData(userData);

                    clearAllInputs();
                    toast('Registration successful! Welcome to MindCare AI.', 'success');
                    navigate(`/${getRoutePrefix(backendRole)}/dashboard`);

                } else if (role === 'clinician') {
                    res = await registerDoctor({ first_name: fName, mid_name: mName, last_name: lName, email, password, specialisation });

                    toast('Registration submitted! Awaiting Admin approval.', 'success');
                    setIsRegistering(false);
                    clearAllInputs();
                }
            } else {
                res = await loginUser({ email, password, role: backendRole });

                const userData = { ...(res.data || {}), role: backendRole };
                saveAuthData(userData);

                clearAllInputs();
                toast(`Welcome back, ${userData.first_name || 'User'}!`, 'success');
                navigate(`/${getRoutePrefix(backendRole)}/dashboard`);
            }
        } catch (error) {
            toast(error.response?.data?.message || 'Authentication failed', 'error');
        }
    };

    const handleForgotPass = async (e) => {
        e.preventDefault();
        try {
            if (resetStep === 1) {
                await forgotPassword(email);
                toast('Token sent to your email! Please check your inbox.', 'success');
                setResetStep(2);
            } else {
                if (newPass.length < 6) return toast('Password must be at least 6 characters', 'error');
                await resetPassword(resetToken, newPass);
                toast('Password reset successfully! Please log in.', 'success');
                resetForgotPass();
            }
        } catch (error) {
            toast(error.response?.data?.message || 'Reset failed', 'error');
        }
    };

    const resetForgotPass = () => {
        setIsForgotPass(false);
        setResetStep(1);
        clearAllInputs();
    };

    const demoLogin = async (demoRole) => {
        setRole(demoRole);
        clearAllInputs();
        const backendRole = getBackendRole(demoRole);
        const demoCreds = {
            email: demoRole === 'patient' ? 'patient@demo.com' : demoRole === 'admin' ? 'admin@demo.com' : 'doctor@demo.com',
            password: '123456',
            role: backendRole
        };

        try {
            const res = await loginUser(demoCreds);
            const userData = { ...(res.data || {}), role: backendRole };
            saveAuthData(userData);

            toast('Demo login successful!', 'success');
            navigate(`/${getRoutePrefix(backendRole)}/dashboard`);
        } catch (error) {
            toast('Demo users not found in DB. Please register a new account first.', 'warning');
        }
    };

    // --- FORGOT PASSWORD UI ---
    if (isForgotPass) {
        return (
            <div className="screen active">
                <div className="login-bg">
                    <div className="login-card">
                        <div className="login-logo">Reset Password</div>
                        <div className="login-sub">
                            {resetStep === 1
                                ? 'Enter your account email to receive a reset token.'
                                : 'Enter the token from your email and your new password.'}
                        </div>

                        <form onSubmit={handleForgotPass} autoComplete="off">
                            {resetStep === 1 ? (
                                <div className="fg">
                                    <label className="fl">Email address</label>
                                    <input className="fi" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="off" name="no-autofill-email-1" />
                                </div>
                            ) : (
                                <>
                                    <div className="fg">
                                        <label className="fl">Reset Token</label>
                                        <input className="fi" type="text" required value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="Paste token from email" autoComplete="off" name="no-autofill-token" />
                                    </div>
                                    <div className="fg">
                                        <label className="fl">New Password</label>
                                        <input className="fi" type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" name="no-autofill-newpass" />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-pri btn-lg btn-block">
                                {resetStep === 1 ? 'Send Reset Token' : 'Update Password'} <i className="ti ti-arrow-right"></i>
                            </button>

                            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={resetForgotPass}>
                                    <i className="ti ti-arrow-left"></i> Back to Login
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN LOGIN / REGISTER UI ---
    return (
        <div className="screen active" id="scr-login">
            <div className="login-bg">
                <div className="login-card">
                    <div className="login-logo">MindCare AI</div>
                    <div className="login-sub">AI-Based Mental Healthcare Prediction System</div>

                    <div className="role-tog">
                        <button type="button" className={`role-btn ${role === 'patient' ? 'active' : ''}`} onClick={() => { setRole('patient'); setIsRegistering(false); clearAllInputs(); }}>
                            <i className="ti ti-user"></i> Patient
                        </button>
                        <button type="button" className={`role-btn ${role === 'clinician' ? 'active' : ''}`} onClick={() => { setRole('clinician'); setIsRegistering(false); clearAllInputs(); }}>
                            <i className="ti ti-stethoscope"></i> Clinician
                        </button>
                        <button type="button" className={`role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => { setRole('admin'); setIsRegistering(false); clearAllInputs(); }}>
                            <i className="ti ti-shield-check"></i> Admin
                        </button>
                    </div>

                    <form onSubmit={handleAuth} autoComplete="off" key={isRegistering ? 'reg' : 'login'}>
                        {isRegistering && (
                            <>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div className="fg" style={{ flex: 1 }}>
                                        <label className="fl">First Name</label>
                                        <input className="fi" type="text" required value={fName} onChange={e => setFName(e.target.value)} autoComplete="off" name="no-autofill-fname" />
                                    </div>
                                    <div className="fg" style={{ flex: 1 }}>
                                        <label className="fl">Middle Name</label>
                                        <input className="fi" type="text" value={mName} onChange={e => setMName(e.target.value)} autoComplete="off" name="no-autofill-mname" />
                                    </div>
                                </div>
                                <div className="fg">
                                    <label className="fl">Last Name</label>
                                    <input className="fi" type="text" required value={lName} onChange={e => setLName(e.target.value)} autoComplete="off" name="no-autofill-lname" />
                                </div>
                                {role === 'clinician' && (
                                    <div className="fg">
                                        <label className="fl">Specialisation</label>
                                        <input className="fi" type="text" required value={specialisation} onChange={e => setSpecialisation(e.target.value)} placeholder="e.g. Psychiatry" autoComplete="off" name="no-autofill-spec" />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="fg">
                            <label className="fl">Email address</label>
                            <input className="fi" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="off" name="no-autofill-email-main" />
                        </div>

                        <div className="fg">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="fl">Password</label>
                                {!isRegistering && (
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: 0 }} onClick={() => { setIsRegistering(false); setIsForgotPass(true); clearAllInputs(); }}>
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <input className="fi" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="new-password" name="no-autofill-password-main" />
                        </div>

                        {isRegistering && (
                            <div className="fg" style={{ marginBottom: '12px' }}>
                                <label className="fl">Confirm Password</label>
                                <input className="fi" type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirm your password" autoComplete="new-password" name="no-autofill-confirmpass" />
                            </div>
                        )}

                        <button type="submit" className="btn btn-pri btn-lg btn-block" style={{ marginTop: '16px' }}>
                            {isRegistering ? 'Create Account' : 'Sign in'} <i className="ti ti-arrow-right"></i>
                        </button>

                        {role !== 'admin' && (
                            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setIsRegistering(!isRegistering); clearAllInputs(); }}>
                                    {isRegistering ? 'Back to Login' : 'Create new account'}
                                </button>
                            </div>
                        )}
                    </form>

                    <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                        {/* <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '10px', fontWeight: '600', letterSpacing: '.04em' }}>
                            QUICK DEMO ACCESS
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-out btn-block" style={{ fontSize: '12px' }} onClick={() => demoLogin('patient')}><i className="ti ti-user"></i> Patient</button>
                            <button type="button" className="btn btn-out btn-block" style={{ fontSize: '12px' }} onClick={() => demoLogin('clinician')}><i className="ti ti-stethoscope"></i> Clinician</button>
                            <button type="button" className="btn btn-out btn-block" style={{ fontSize: '12px' }} onClick={() => demoLogin('admin')}><i className="ti ti-shield-check"></i> Admin</button>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
}