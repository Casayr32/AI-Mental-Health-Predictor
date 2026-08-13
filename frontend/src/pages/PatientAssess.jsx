import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitAssessment } from '../services/api';
import { toast } from '../App';
import ChooseDoctorModal from '../components/ChooseDoctorModal';

const symptomOptions = [
    'feeling anxious', 'excessive worry', 'trouble sleeping', 'panic attacks',
    'loss of interest in activities', 'lack of concentration', 'feeling irritable', 'feeling sad', 'feeling overwhelmed'
];

const diagnosisOptions = ['None', 'OCD', 'PTSD', 'Bipolar Disorder', 'Anxiety', 'Depression'];

export default function PatientAssess() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);

    // ====================================================================
    // SAFE STATE: Si sax ah ula soco localStorage (XAASKAN SELF-HEALING MA JIRO)
    // ====================================================================
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            return null;
        }
    });

    const [form, setForm] = useState({
        q1_symptoms: '',
        q2_duration_weeks: '',
        q3_previous_diagnosis: 'None',
        q4_therapy_history: 'No',
        q5_medication: 'No',
        q6_mood: 0,
        q7_stress_level: 0
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleToggle = (name, value) => setForm({ ...form, [name]: value });
    const handleScale = (name, val) => setForm({ ...form, [name]: val });

    const answeredCount = Object.values(form).filter(v => v !== '' && v !== 0).length;

    const safeAssignDoctor = (newData) => {
        let existingUser = {};
        try {
            existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            existingUser = {};
        }

        const SAVED_TOKEN = localStorage.getItem('token') || existingUser.token;

        if (!existingUser._id || !existingUser.role || !SAVED_TOKEN) {
            console.error('[FATAL] Session data missing. Logout triggered.');
            toast('Authentication error. Please log in again.', 'error');
            window.dispatchEvent(new Event('logout'));
            return;
        }

        const updatedUser = {
            ...existingUser,
            assigned_doctor: newData.assigned_doctor,
            token: SAVED_TOKEN
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('token', SAVED_TOKEN);
        setUser(updatedUser);
    };

    const handleDoctorAssigned = (newData) => {
        safeAssignDoctor(newData);
        setShowDoctorModal(false);
        toast('Doctor assigned successfully!', 'success');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (answeredCount < 7) return toast('Please answer all 7 questions before submitting.', 'warning');

        const durationNum = Number(form.q2_duration_weeks);
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 51) {
            return toast('Duration must be between 1 and 51 weeks.', 'error');
        }

        try {
            setLoading(true);
            const payload = {
                ...form,
                q2_duration_weeks: durationNum,
                q6_mood: Number(form.q6_mood),
                q7_stress_level: Number(form.q7_stress_level)
            };

            const res = await submitAssessment(payload);
            sessionStorage.setItem('latestResult', JSON.stringify(res.data));
            toast('Assessment analyzed successfully!', 'success');
            navigate('/patient/result');
        } catch (error) {
            if (error.response?.status !== 401) {
                toast(error.response?.data?.message || 'Failed to submit assessment', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // 1. BLOCK IF NO DOCTOR
    if (!user || !user.assigned_doctor) {
        return (
            <div className="screen active" id="scr-p-assess">
                <div className="layout">
                    <aside className="sidebar">
                        <div className="sb-logo">MindCare AI<span>MENTAL HEALTHCARE</span></div>
                        <div className="sb-sec">Main</div>
                        <div className="sb-item" onClick={() => navigate('/patient/dashboard')}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                        <div className="sb-item active"><i className="ti ti-clipboard-check"></i> New Assessment</div>
                        <div className="sb-item" onClick={() => navigate('/patient/history')}><i className="ti ti-history"></i> History</div>
                        <div className="sb-item" onClick={() => navigate('/patient/messages')}><i className="ti ti-message"></i> Messages</div>
                        <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                            <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); }}>
                                <i className="ti ti-logout"></i> Logout
                            </div>
                        </div>
                    </aside>
                    <main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                        <ChooseDoctorModal onDoctorAssigned={safeAssignDoctor} />
                    </main>
                </div>
            </div>
        );
    }

    // 2. MAIN ASSESSMENT UI
    return (
        <div className="screen active" id="scr-p-assess">
            <header className="mob-hdr">
                <button className={`ham ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <i className="ti ti-menu-2"></i>
                </button>
                <div className="mht">MindCare AI</div>
            </header>
            <div className={`sb-ov ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
            <div className="layout">
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>MENTAL HEALTHCARE</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item active" onClick={() => setSidebarOpen(false)}><i className="ti ti-clipboard-check"></i> New Assessment</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/history'); setSidebarOpen(false); }}><i className="ti ti-history"></i> History</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>
                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <div className="ptitle">Mental Health Assessment</div>
                            <div className="psub">Answer all 7 questions honestly. This takes about 3 minutes.</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
                                Doctor: <strong>Dr. {user.assigned_doctor.full_name || user.assigned_doctor.name || 'Assigned'}</strong>
                            </span>
                            <button type="button" className="btn btn-out" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setShowDoctorModal(true)}>
                                <i className="ti ti-user-exclamation"></i> Change Doctor
                            </button>
                        </div>
                    </div>

                    {showDoctorModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                                <button onClick={() => setShowDoctorModal(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                                <ChooseDoctorModal onDoctorAssigned={handleDoctorAssigned} />
                            </div>
                        </div>
                    )}

                    <div className="steps">
                        <div className="step step-done"><div className="step-n"><i className="ti ti-check" style={{ fontSize: '12px' }}></i></div><span className="step-l">Identity</span></div>
                        <div className="step-line step-line-done"></div>
                        <div className="step step-act"><div className="step-n">2</div><span className="step-l">Assessment</span></div>
                        <div className="step-line"></div>
                        <div className="step step-pend"><div className="step-n">3</div><span className="step-l">AI Analysis</span></div>
                        <div className="step-line"></div>
                        <div className="step step-pend"><div className="step-n">4</div><span className="step-l">Results</span></div>
                    </div>

                    <div className="card" style={{ background: '#EFF8F4', borderColor: '#B6E5D2', marginBottom: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--pri-dark)' }}>
                        <i className="ti ti-lock" style={{ fontSize: '18px' }}></i>
                        <span>All responses are confidential and encrypted. Your data is protected.</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="card">
                            <div id="assessQs">
                                <div className="fg">
                                    <label className="fl">Q1. What is the primary symptom you are currently experiencing?</label>
                                    <select className="fi" name="q1_symptoms" value={form.q1_symptoms} onChange={handleChange} required>
                                        <option value="" disabled>Select a symptom...</option>
                                        {symptomOptions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="fg">
                                    <label className="fl">Q2. How many weeks have you been experiencing this symptom? (1 - 51)</label>
                                    <input className="fi" type="number" name="q2_duration_weeks" min="1" max="51" value={form.q2_duration_weeks} onChange={handleChange} placeholder="e.g. 12" required />
                                </div>
                                <div className="fg">
                                    <label className="fl">Q3. Do you have any previous mental health diagnosis?</label>
                                    <select className="fi" name="q3_previous_diagnosis" value={form.q3_previous_diagnosis} onChange={handleChange} required>
                                        {diagnosisOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="fg">
                                    <label className="fl">Q4. Have you previously undergone any form of therapy?</label>
                                    <div className="toggle-wrap">
                                        <label className="toggle"><input type="radio" name="q4_therapy_history" value="Yes" checked={form.q4_therapy_history === 'Yes'} onChange={() => handleToggle('q4_therapy_history', 'Yes')} /><div className="toggle-track"></div><div className="toggle-knob"></div></label><span className="toggle-label">Yes</span>
                                        <label className="toggle" style={{ marginLeft: '12px' }}><input type="radio" name="q4_therapy_history" value="No" checked={form.q4_therapy_history === 'No'} onChange={() => handleToggle('q4_therapy_history', 'No')} /><div className="toggle-track"></div><div className="toggle-knob"></div></label><span className="toggle-label">No</span>
                                    </div>
                                </div>
                                <div className="fg">
                                    <label className="fl">Q5. Are you currently taking any mental health medication?</label>
                                    <div className="toggle-wrap">
                                        <label className="toggle"><input type="radio" name="q5_medication" value="Yes" checked={form.q5_medication === 'Yes'} onChange={() => handleToggle('q5_medication', 'Yes')} /><div className="toggle-track"></div><div className="toggle-knob"></div></label><span className="toggle-label">Yes</span>
                                        <label className="toggle" style={{ marginLeft: '12px' }}><input type="radio" name="q5_medication" value="No" checked={form.q5_medication === 'No'} onChange={() => handleToggle('q5_medication', 'No')} /><div className="toggle-track"></div><div className="toggle-knob"></div></label><span className="toggle-label">No</span>
                                    </div>
                                </div>
                                <div className="fg">
                                    <label className="fl">Q6. On a scale of 1 to 10, how would you rate your current mood?</label>
                                    <div className="scale-row">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (<button type="button" key={num} className={`scale-btn ${form.q6_mood === num ? 'sel' : ''}`} onClick={() => handleScale('q6_mood', num)}>{num}</button>))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginTop: '4px', padding: '0 2px' }}><span>1 (Very Low)</span><span>10 (Very High)</span></div>
                                </div>
                                <div className="fg" style={{ marginBottom: '0' }}>
                                    <label className="fl">Q7. On a scale of 1 to 10, how would you rate your current stress level?</label>
                                    <div className="scale-row">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (<button type="button" key={num} className={`scale-btn ${form.q7_stress_level === num ? 'sel' : ''}`} onClick={() => handleScale('q7_stress_level', num)}>{num}</button>))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginTop: '4px', padding: '0 2px' }}><span>1 (Very Low)</span><span>10 (Very High)</span></div>
                                </div>
                            </div>
                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{answeredCount} of 7 answered</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" className="btn btn-out" onClick={() => setForm({ q1_symptoms: '', q2_duration_weeks: '', q3_previous_diagnosis: 'None', q4_therapy_history: 'No', q5_medication: 'No', q6_mood: 0, q7_stress_level: 0 })}><i className="ti ti-refresh"></i> Reset</button>
                                    <button type="submit" className="btn btn-pri" disabled={loading}>{loading ? 'Analyzing...' : (<><i className="ti ti-brain"></i> Submit Assessment</>)}</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}