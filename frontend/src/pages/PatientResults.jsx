import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientHistory, getPatientFeedback } from '../services/api';
import { toast } from '../App';

export default function PatientResults() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [assessments, setAssessments] = useState([]);
    const [feedbackMap, setFeedbackMap] = useState({});
    const [selectedId, setSelectedId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [histRes, feedRes] = await Promise.all([
                    getPatientHistory(),
                    getPatientFeedback()
                ]);

                const history = histRes.data || [];
                setAssessments(history);

                // Map feedbacks to their assessment IDs for easy lookup
                const fMap = {};
                (feedRes.data || []).forEach(f => {
                    if (f.assessment_id?._id) {
                        fMap[f.assessment_id._id] = f.feedback_text;
                    }
                });
                setFeedbackMap(fMap);

                // Auto-select the latest assessment
                if (history.length > 0) {
                    setSelectedId(history[0]._id);
                }
            } catch (error) {
                toast('Failed to load assessment history.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const currentAssessment = assessments.find(a => a._id === selectedId);
    const currentFeedback = feedbackMap[selectedId] || "No clinical feedback available for this assessment.";

    // Helper for Urgency Badge Color
    const getUrgencyStyle = (level) => {
        switch (level) {
            case 'Critical': return { background: '#ffeaea', color: '#d32f2f', border: '1px solid #ffcdd2' };
            case 'High': return { background: '#fff3e0', color: '#f57c00', border: '1px solid #ffe0b2' };
            case 'Moderate': return { background: '#fff9c4', color: '#fbc02d', border: '1px solid #fff176' };
            default: return { background: '#e8f5e9', color: '#388e3c', border: '1px solid #c8e6c9' };
        }
    };

    const Sidebar = () => (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <header className="mob-hdr">
                <button className={`ham ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <i className="ti ti-menu-2"></i>
                </button>
                <div className="mht">MindCare AI</div>
            </header>
            <div className={`sb-ov ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
            <div className="sb-logo">MindCare AI<span>MENTAL HEALTHCARE</span></div>
            <div className="sb-sec">Main</div>
            <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
            <div className="sb-item" onClick={() => { navigate('/patient/assess'); setSidebarOpen(false); }}><i className="ti ti-clipboard-check"></i> New Assessment</div>
            <div className="sb-item active" onClick={() => { navigate('/patient/results'); setSidebarOpen(false); }}><i className="ti ti-chart-bar"></i> Assessment Results</div>
            <div className="sb-item" onClick={() => { navigate('/patient/history'); setSidebarOpen(false); }}><i className="ti ti-history"></i> History</div>
            <div className="sb-item" onClick={() => { navigate('/patient/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>
            <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                    <i className="ti ti-logout"></i> Logout
                </div>
            </div>
        </aside>
    );

    if (loading) return (
        <div className="screen active"><header className="mob-hdr"><div className="mht">MindCare AI</div></header><div className="layout"><Sidebar /><main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><div className="card" style={{ padding: '20px' }}>Loading history...</div></main></div></div>
    );

    if (assessments.length === 0) return (
        <div className="screen active"><header className="mob-hdr"><div className="mht">MindCare AI</div></header><div className="layout"><Sidebar /><main className="main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="card" style={{ textAlign: 'center', maxWidth: '400px', padding: '30px' }}>
                <i className="ti ti-file-off" style={{ fontSize: '40px', color: 'var(--text3)', marginBottom: '10px' }}></i>
                <h3>No Assessments Yet</h3>
                <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>You haven't taken any assessments yet. Start your first one to see results here.</p>
                <button className="btn btn-pri" onClick={() => navigate('/patient/assess')}>Take Assessment</button>
            </div>
        </main></div></div>
    );

    return (
        <div className="screen active" id="scr-p-results">
            <header className="mob-hdr">
                <button className={`ham ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <i className="ti ti-menu-2"></i>
                </button>
                <div className="mht">MindCare AI</div>
            </header>
            <div className={`sb-ov ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
            <div className="layout">
                <Sidebar />

                <main className="main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div className="ptitle">Assessment Results</div>
                            <div className="psub">Select a past assessment to view the detailed AI analysis and clinical feedback.</div>
                        </div>

                        {/* DROPDOWN LIST */}
                        <div className="fg" style={{ marginBottom: '0', minWidth: '300px' }}>
                            <select
                                className="fi"
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                style={{ fontWeight: '500' }}
                            >
                                {assessments.map((a) => (
                                    <option key={a._id} value={a._id}>
                                        {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        {' - '}
                                        {a.predicted_disorder} ({a.urgency_level})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {currentAssessment && (
                        <>
                            {/* Header Card */}
                            <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #f3f0ff 0%, #e8f4f8 100%)', border: 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>AI Analysis Completed</div>
                                        <h2 style={{ margin: 0, color: 'var(--pri-dark)', fontSize: '24px' }}>
                                            {currentAssessment.predicted_disorder}
                                        </h2>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>Urgency Level</div>
                                        <span style={{ padding: '6px 16px', borderRadius: '20px', fontWeight: '600', fontSize: '14px', ...getUrgencyStyle(currentAssessment.urgency_level) }}>
                                            {currentAssessment.urgency_level}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>

                                <div className="card" style={{ margin: 0 }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Suggested Therapy</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="ti ti-heart-rate-monitor" style={{ color: 'var(--pri)' }}></i>
                                        {currentAssessment.suggested_therapy}
                                    </div>
                                </div>

                                <div className="card" style={{ margin: 0 }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Self-Care Advice</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="ti ti-leaf" style={{ color: 'var(--pri)' }}></i>
                                        {currentAssessment.self_care_advice}
                                    </div>
                                </div>

                                <div className="card" style={{ margin: 0 }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>AI Confidence Score</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, background: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${currentAssessment.confidence_score}%`, background: '#4caf50', height: '100%', borderRadius: '10px' }}></div>
                                        </div>
                                        <span style={{ fontWeight: '700', color: '#4caf50' }}>{currentAssessment.confidence_score}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Symptoms Summary */}
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    Assessment Details
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                                    <div><span style={{ color: 'var(--text3)' }}>Primary Symptom:</span> <strong>{currentAssessment.q1_symptoms}</strong></div>
                                    <div><span style={{ color: 'var(--text3)' }}>Duration:</span> <strong>{currentAssessment.q2_duration_weeks} weeks</strong></div>
                                    <div><span style={{ color: 'var(--text3)' }}>Previous Diagnosis:</span> <strong>{currentAssessment.q3_previous_diagnosis}</strong></div>
                                    <div><span style={{ color: 'var(--text3)' }}>Mood Score:</span> <strong>{currentAssessment.q6_mood}/10</strong></div>
                                </div>
                            </div>

                            {/* Clinical Feedback */}
                            <div className="card" style={{ background: '#fff8e1', borderColor: '#ffecb3' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <i className="ti ti-message-circle-2" style={{ fontSize: '24px', color: '#ffa000', marginTop: '2px' }}></i>
                                    <div>
                                        <div style={{ fontWeight: '700', marginBottom: '6px', color: '#ff6f00' }}>Clinical Feedback</div>
                                        <p style={{ margin: 0, color: '#5d4037', lineHeight: '1.6' }}>
                                            {currentFeedback}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}