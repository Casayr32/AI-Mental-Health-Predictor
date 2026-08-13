import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableDoctors, assignDoctor } from '../services/api';
import { toast } from '../App';

export default function PatientResult() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        // Get results from session storage (saved by the Assessment page)
        const data = JSON.parse(sessionStorage.getItem('latestResult'));
        if (!data) return navigate('/patient/assess');
        setResult(data);

        // Fetch active doctors ONLY IF the patient needs one
        if (data.needs_doctor) {
            const fetchDocs = async () => {
                const res = await getAvailableDoctors();
                setDoctors(res.data);
            };
            fetchDocs();
        }
    }, [navigate]);

    const handleAssign = async () => {
        if (!selectedDoc) return toast('Please select a doctor', 'warning');
        try {
            setAssigning(true);
            await assignDoctor(selectedDoc);
            toast('Doctor assigned successfully! They have been notified.', 'success');
            // Update local state so the UI changes and the card vanishes
            setResult(prev => ({ ...prev, needs_doctor: false }));
            setDoctors([]); // Clear doctors list to free up memory
        } catch (error) {
            toast(error.response?.data?.message || 'Failed to assign doctor', 'error');
        } finally {
            setAssigning(false);
        }
    };

    // Dynamic styling based on Urgency Level
    const getUrgencyColor = () => {
        if (!result) return 'var(--pri)';
        const u = result.assessment.urgency_level;
        if (u === 'Low') return 'var(--pri)';
        if (u === 'Moderate') return 'var(--amber)';
        if (u === 'High') return 'var(--coral)';
        if (u === 'Critical') return 'var(--red)';
        return 'var(--pri)';
    };

    const getUrgencyBadge = () => {
        if (!result) return 'b-low';
        const u = result.assessment.urgency_level;
        if (u === 'Low') return 'b-low';
        if (u === 'Moderate') return 'b-mod';
        if (u === 'High') return 'b-high';
        if (u === 'Critical') return 'b-crit';
        return 'b-low';
    };

    if (!result) return null;

    const { assessment, feedback } = result;

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
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>MENTAL HEALTHCARE</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item active" onClick={() => setSidebarOpen(false)}><i className="ti ti-clipboard-check"></i> Assessment Results</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/history'); setSidebarOpen(false); }}><i className="ti ti-history"></i> History</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main">
                    <div className="ptitle">Assessment Results</div>
                    <div className="psub">AI Analysis completed successfully. Review your results below.</div>

                    {/* Hero Card (Dynamically colored) */}
                    <div className="res-hero" style={{ background: getUrgencyColor(), color: '#fff', marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Predicted Condition</div>
                        <div className="res-disorder" style={{ color: '#fff' }}>{assessment.predicted_disorder}</div>
                        <div style={{ marginTop: '12px' }}>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                Urgency: {assessment.urgency_level}
                            </span>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="res-grid">
                        <div className="res-item">
                            <div className="res-val" style={{ fontSize: '16px' }}>{assessment.suggested_therapy}</div>
                            <div className="res-lbl">Suggested Therapy</div>
                        </div>
                        <div className="res-item">
                            <div className="res-val" style={{ fontSize: '16px' }}>{assessment.self_care_advice}</div>
                            <div className="res-lbl">Self-care Advice</div>
                        </div>
                        {/* AI Confidence Score (Restored) */}
                        <div className="res-item">
                            <div className="res-val">{(assessment.confidence_score * 100).toFixed(0)}%</div>
                            <div className="res-lbl">AI Confidence</div>
                        </div>
                        <div className="res-item">
                            <div className="res-val"><span className={`badge ${getUrgencyBadge()}`}>{assessment.urgency_level}</span></div>
                            <div className="res-lbl">Urgency Level</div>
                        </div>
                    </div>

                    {/* Automated Feedback */}
                    <div className="card" style={{ marginBottom: '20px', borderLeft: `4px solid ${getUrgencyColor()}` }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ti ti-message-circle"></i> Clinical Feedback
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>{feedback}</p>
                    </div>

                    {/* Doctor Assignment Section - COMPLETELY HIDDEN if they already have a doctor */}
                    {result.needs_doctor && (
                        <div className="card">
                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="ti ti-user-plus"></i> Assign a Doctor
                            </h3>

                            {doctors.length > 0 ? (
                                <>
                                    <div className="fg" style={{ marginBottom: '16px' }}>
                                        <label className="fl">Select a specialist to review your case:</label>
                                        <select className="fi" value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)}>
                                            <option value="" disabled>-- Choose a Doctor --</option>
                                            {doctors.map(doc => (
                                                <option key={doc._id} value={doc._id}>
                                                    Dr. {doc.first_name} {doc.last_name} ({doc.specialisation})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="btn btn-pri" onClick={handleAssign} disabled={assigning}>
                                        {assigning ? 'Assigning...' : 'Assign Selected Doctor'}
                                    </button>
                                </>
                            ) : (
                                <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
                                    There are no active doctors available in the system at the moment. Please check back later.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-out" onClick={() => navigate('/patient/history')}>
                            <i className="ti ti-history"></i> View Full History
                        </button>
                        <button className="btn btn-pri" onClick={() => navigate('/patient/dashboard')}>
                            Go to Dashboard <i className="ti ti-arrow-right"></i>
                        </button>
                    </div>

                </main>
            </div>
        </div>
    );
}