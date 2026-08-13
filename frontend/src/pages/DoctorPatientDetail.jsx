import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatientDetails } from '../services/api';

export default function DoctorPatientDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get patient ID from URL
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            const res = await getPatientDetails(id);
            setData(res.data);
        };
        fetchDetails();
    }, [id]);

    const getUrgencyBadge = (level) => {
        if (level === 'Low') return 'b-low';
        if (level === 'Moderate') return 'b-mod';
        if (level === 'High') return 'b-high';
        if (level === 'Critical') return 'b-crit';
        return 'b-low';
    };

    if (!data) return <div className="main main-dark"><div className="ptitle">Loading Patient Data...</div></div>;

    const { patient, assessments } = data;

    return (
        <div className="screen active">
            <header className="mob-hdr">
                <button className={`ham ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <i className="ti ti-menu-2"></i>
                </button>
                <div className="mht">MindCare AI</div>
            </header>
            <div className={`sb-ov ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
            <div className="layout">
                <aside className={`sidebar sb-dark ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>CLINICIAN PORTAL</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/alerts'); setSidebarOpen(false); }}><i className="ti ti-alert-triangle"></i> Alerts</div>
                    <div className="sb-item active" onClick={() => { navigate('/doctor/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main main-dark">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <span className="btn btn-ghost btn-sm" style={{ color: 'var(--dk-text2)' }} onClick={() => navigate('/doctor/dashboard')}>
                            <i className="ti ti-arrow-left"></i> Back to Patients
                        </span>
                    </div>

                    <div className="ptitle">Patient Profile</div>
                    <div className="psub">Full medical history and AI assessment records.</div>

                    {/* --- NEW: CONTINUITY OF CARE BANNER --- */}
                    {patient.doctor_history && patient.doctor_history.length > 0 && (
                        <div className="card" style={{ marginBottom: '20px', background: 'rgba(52, 211, 153, 0.1)', borderColor: 'var(--dk-accent)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="ti ti-info-circle" style={{ fontSize: '20px', color: 'var(--dk-accent)' }}></i>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--dk-text)' }}>Continuity of Care Active</div>
                                <div style={{ fontSize: '12px', color: 'var(--dk-text2)' }}>
                                    This patient was previously under the care of Dr. {patient.doctor_history[0].doctor_id?.first_name} {patient.doctor_history[0].doctor_id?.last_name}. You have full access to all historical assessments taken during that period.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Patient Header Card */}
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="det-head">
                            <div className="det-av av-pri" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--dk-accent)', width: '64px', height: '64px', fontSize: '22px' }}>
                                {patient.first_name[0]}{patient.last_name[0]}
                            </div>
                            <div className="det-info">
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--dk-text)' }}>{patient.first_name} {patient.last_name}</h2>
                                <p style={{ fontSize: '13px', color: 'var(--dk-text3)' }}>{patient.email}</p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--dk-accent)' }}>{patient.status}</span>
                                    {patient.doctor_history && patient.doctor_history.length > 0 && (
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--dk-text2)' }}>
                                            <i className="ti ti-history" style={{ fontSize: '10px', verticalAlign: 'middle', marginRight: '4px' }}></i> Previous Doctors: {patient.doctor_history.length}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="det-actions">
                                {/* <button className="btn btn-dl" onClick={() => navigate('/doctor/messages')}>
                                    <i className="ti ti-message"></i> Send Message
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Assessment History Table (Continuity of Care) */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dk-border)' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--dk-text)' }}>
                                Complete Assessment History
                                <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--dk-text3)', marginLeft: '8px' }}>(Includes records from previous doctors)</span>
                            </h3>
                        </div>
                        <div className="tw">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Symptom</th>
                                        <th>AI Prediction</th>
                                        <th>Urgency</th>
                                        <th>Therapy Suggested</th>
                                        <th>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.length > 0 ? assessments.map((a) => (
                                        <tr key={a._id}>
                                            <td>{new Date(a.created_at).toLocaleDateString()}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{a.q1_symptoms}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--dk-text)' }}>{a.predicted_disorder}</td>
                                            <td><span className={`badge ${getUrgencyBadge(a.urgency_level)}`}>{a.urgency_level}</span></td>
                                            <td style={{ fontSize: '12px', maxWidth: '200px', whiteSpace: 'normal' }}>{a.suggested_therapy}</td>
                                            <td>{(a.confidence_score * 100).toFixed(0)}%</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--dk-text3)', padding: '40px' }}>
                                                This patient has not completed any assessments yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}