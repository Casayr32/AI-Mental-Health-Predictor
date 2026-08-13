import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { getPatientHistory, getMyProfile } from '../services/api';
import ChooseDoctorModal from '../components/ChooseDoctorModal';
import Chatbot from '../components/Chatbot';
import ChatbotDebug from './ChatbotDebug';

export default function PatientDashboard() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            if (!saved) return null;
            const parsed = JSON.parse(saved);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profileRes = await getMyProfile();
                if (profileRes?.data && typeof profileRes.data === 'object') {
                    setUser(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            assigned_doctor: profileRes.data.assigned_doctor,
                            doctor_history: profileRes.data.doctor_history
                        };
                    });
                }

                const res = await getPatientHistory();
                if (res?.data && Array.isArray(res.data)) {
                    setHistory(res.data);
                }
            } catch (err) {
                console.error("Error fetching patient dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Use Navigate component instead of navigate() during render
    if (!user && !loading) {
        return <Navigate to="/login" replace />;
    }

    if (loading && !user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
                <div style={{ textAlign: 'center' }}>
                    <i className="ti ti-loader animate-spin" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                    <div>Loading Patient Dashboard...</div>
                </div>
            </div>
        );
    }

    // --- Data Calculations ---
    const totalAssessments = history.length;
    const latestAssessment = history[0] || null;
    const currentStatus = latestAssessment?.predicted_disorder || 'No assessments yet';
    const latestUrgency = latestAssessment?.urgency_level || 'None';

    const avgMood = totalAssessments > 0
        ? (history.reduce((acc, curr) => acc + (Number(curr.q6_mood) || 0), 0) / totalAssessments).toFixed(1)
        : '0.0';

    const disorderCounts = history.reduce((acc, curr) => {
        if (curr?.predicted_disorder) {
            acc[curr.predicted_disorder] = (acc[curr.predicted_disorder] || 0) + 1;
        }
        return acc;
    }, {});

    const maxDisorderCount = Math.max(...Object.values(disorderCounts), 1);
    const recentActivity = history.slice(0, 5);
    const trendData = history.slice(0, 10).reverse();

    const doctorName = user?.assigned_doctor?.first_name
        ? `Dr. ${user.assigned_doctor.first_name} ${user.assigned_doctor.last_name || ''}`
        : 'Unassigned';
    const doctorSpec = user?.assigned_doctor?.specialisation || 'Select in Results';

    return (
        <div className="screen active">
            <div className="layout">
                {/* Mobile Header */}
                <header className="mob-hdr">
                    <button className={`ham ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <i className="ti ti-menu-2"></i>
                    </button>
                    <div className="mht">MindCare AI</div>
                </header>

                {/* Mobile Sidebar Overlay */}
                <div className={`sb-ov ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>MENTAL HEALTHCARE</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/assess'); setSidebarOpen(false); }}><i className="ti ti-clipboard-check"></i> New Assessment</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/results'); setSidebarOpen(false); }}><i className="ti ti-chart-bar"></i> Assessment Results</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/history'); setSidebarOpen(false); }}><i className="ti ti-history"></i> History</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>
                    <div className="sb-item chatbot-trigger" onClick={() => { setShowChatbot(true); setSidebarOpen(false); }}>
                        <i className="ti ti-message-circle"></i> AI Support
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/patient/chatbot-debug'); setSidebarOpen(false); }} style={{ color: 'var(--text3)', fontSize: '12px', display: 'none' }}>
                        <i className="ti ti-bug"></i> API Debug
                    </div>
                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main">
                    <div className="ptitle">Welcome back, {user?.first_name || 'User'}</div>
                    <div className="psub">Here's an overview of your mental health journey.</div>

                    {/* Top Metrics Row */}
                    <div className="metric-row">
                        <div className="metric">
                            <div className="metric-label">Total Assessments</div>
                            <div className="metric-val" style={{ color: 'var(--pri)' }}>{totalAssessments}</div>
                            <div className="metric-change">{latestAssessment ? `Last: ${new Date(latestAssessment.created_at).toLocaleDateString()}` : 'None yet'}</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">Current Status</div>
                            <div className="metric-val" style={{ color: (latestUrgency === 'High' || latestUrgency === 'Critical') ? 'var(--coral)' : 'var(--amber)', fontSize: '18px' }}>{currentStatus}</div>
                            <div className="metric-change">{latestUrgency} urgency</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">Avg Mood Score</div>
                            <div className="metric-val" style={{ color: 'var(--blue)' }}>{avgMood}</div>
                            <div className="metric-change">Out of 10</div>
                        </div>
                        <div className="metric" id="clinician-metric">
                            <div className="metric-label">Current Clinician</div>
                            <div className="metric-val" style={{ fontSize: '16px' }}>{doctorName}</div>
                            <div className="metric-change">{doctorSpec}</div>
                        </div>
                    </div>

                    {/* URGENT: Choose Clinician Card */}
                    {!user?.assigned_doctor && (
                        <div className="card" style={{ marginBottom: '20px', background: '#FEF6E0', borderColor: 'var(--amber)', borderLeft: '4px solid var(--amber)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <i className="ti ti-alert-triangle" style={{ fontSize: '32px', color: 'var(--amber)', flexShrink: 0 }}></i>
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--amber-dark)', marginBottom: '4px' }}>Clinician Assignment Required</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                                        You currently do not have an assigned clinician. Please select one below to unlock your full dashboard and begin assessments.
                                    </p>
                                    <button className="btn btn-pri" onClick={() => setShowDoctorModal(true)}>
                                        <i className="ti ti-user-plus"></i> Choose Clinician Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Care Team History Card */}
                    <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--pri)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ti ti-users-group" style={{ color: 'var(--pri)' }}></i> My Care Team History
                        </h3>

                        {Array.isArray(user?.doctor_history) && user.doctor_history.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: user?.assigned_doctor ? '12px' : '0' }}>
                                {user.doctor_history.map((hist, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--rs)', border: '1px solid var(--border)' }}>
                                        <div className="av" style={{ background: 'var(--red-light)', color: 'var(--red-dark)' }}>
                                            {hist.doctor_id?.first_name?.[0]}{hist.doctor_id?.last_name?.[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>Dr. {hist.doctor_id?.first_name} {hist.doctor_id?.last_name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                                {hist.doctor_id?.specialisation} • From: {new Date(hist.assigned_at).toLocaleDateString()} to: {hist.unassigned_at ? new Date(hist.unassigned_at).toLocaleDateString() : 'Present'}
                                            </div>
                                        </div>
                                        <span className="badge b-mod">Previous</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {user?.assigned_doctor && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--pri-light)', borderRadius: 'var(--rs)', border: '1px solid #B6E5D2' }}>
                                <div className="av av-pri">
                                    {user.assigned_doctor.first_name?.[0]}{user.assigned_doctor.last_name?.[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Dr. {user.assigned_doctor.first_name} {user.assigned_doctor.last_name} (Current)</div>
                                    <div style={{ fontSize: '11px', color: 'var(--pri-dark)' }}>{user.assigned_doctor.specialisation}</div>
                                </div>
                                <span className="badge b-low">Active</span>
                            </div>
                        )}

                        {!user?.assigned_doctor && (!Array.isArray(user?.doctor_history) || user.doctor_history.length === 0) && (
                            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No care team history yet.</p>
                        )}
                    </div>

                    {/* Grid: Distribution & Activity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        {/* Disorder Distribution */}
                        <div className="card">
                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Disorder Distribution</h3>
                            {Object.keys(disorderCounts).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {Object.entries(disorderCounts).map(([disorder, count]) => (
                                        <div key={disorder}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600 }}>{disorder}</span>
                                                <span style={{ color: 'var(--text3)' }}>{count}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${(count / maxDisorderCount) * 100}%`, height: '100%', background: 'var(--pri)', borderRadius: '4px', transition: 'width 0.3s' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No data to display yet.</p>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="card">
                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Activity</h3>
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '12px', borderBottom: idx !== recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.predicted_disorder}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(item.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`badge ${item.urgency_level === 'Low' ? 'b-low' : item.urgency_level === 'Moderate' ? 'b-mod' : item.urgency_level === 'High' ? 'b-high' : 'b-crit'}`}>
                                            {item.urgency_level}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: 'var(--text3)', fontSize: '13px' }}>No recent activity.</p>
                            )}
                        </div>
                    </div>

                    {/* Mood & Stress Trend */}
                    <div className="card">
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Mood & Stress Trend</h3>
                        {trendData.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', paddingTop: '10px' }}>
                                    {trendData.map((item, idx) => (
                                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '3px' }}>
                                            <div
                                                style={{ height: `${Math.max((Number(item.q6_mood) || 0) * 10, 2)}%`, background: 'var(--blue)', borderRadius: '3px 3px 0 0', opacity: 0.85 }}
                                                title={`Mood: ${item.q6_mood}`}
                                            ></div>
                                            <div
                                                style={{ height: `${Math.max((Number(item.q7_stress_level) || 0) * 10, 2)}%`, background: 'var(--coral)', borderRadius: '3px 3px 0 0', opacity: 0.85 }}
                                                title={`Stress: ${item.q7_stress_level}`}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text3)' }}>
                                    <span>Oldest</span>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <span><span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--blue)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }}></span>Mood</span>
                                        <span><span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--coral)', borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }}></span>Stress</span>
                                    </div>
                                    <span>Most Recent</span>
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Complete assessments to see your trends.</p>
                        )}
                    </div>
                </main>
            </div>

            {showDoctorModal && (
                <ChooseDoctorModal
                    onDoctorAssigned={(newUserData) => {
                        if (newUserData && typeof newUserData === 'object') {
                            localStorage.setItem('user', JSON.stringify(newUserData));
                            setUser(newUserData);
                        }
                        setShowDoctorModal(false);
                    }}
                />
            )}

            {/* Chatbot Modal */}
            {showChatbot && (
                <div className="chatbot-modal-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="chatbot-modal-content" onClick={(e) => e.stopPropagation()}>
                        <Chatbot
                            onClose={() => setShowChatbot(false)}
                            patientName={user?.first_name}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}