import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientHistory } from '../services/api';

export default function PatientHistory() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getPatientHistory();
                setHistory(res.data || []);
            } catch (err) {
                console.error('Failed to load assessment history', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleLogout = () => {
        window.dispatchEvent(new Event('logout'));
    };

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
                {/* Sidebar */}
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">
                        MindCare AI<span>MENTAL HEALTHCARE</span>
                    </div>
                    <div className="sb-sec">Main</div>

                    <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}>
                        <i className="ti ti-layout-dashboard"></i> Dashboard
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/patient/assess'); setSidebarOpen(false); }}>
                        <i className="ti ti-clipboard-check"></i> New Assessment
                    </div>
                    <div className="sb-item active" onClick={() => { navigate('/patient/history'); setSidebarOpen(false); }}>
                        <i className="ti ti-history"></i> History
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/patient/messages'); setSidebarOpen(false); }}>
                        <i className="ti ti-message"></i> Messages
                    </div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { handleLogout(); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main">
                    <div className="ptitle">Assessment History</div>
                    <div className="psub">Review all your previous mental health evaluations and submitted reports.</div>

                    <div className="card">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>
                                <i className="ti ti-loader spin" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                                Loading historical records...
                            </div>
                        ) : history.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                            <th style={{ padding: '12px' }}>Date</th>
                                            <th style={{ padding: '12px' }}>Symptom</th>
                                            <th style={{ padding: '12px' }}>Duration</th>
                                            <th style={{ padding: '12px' }}>Mood</th>
                                            <th style={{ padding: '12px' }}>Stress</th>
                                            <th style={{ padding: '12px' }}>Predicted Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item, index) => (
                                            <tr key={item._id || index} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px' }}>{new Date(item.created_at || item.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px' }}>{item.q1_symptoms}</td>
                                                <td style={{ padding: '12px' }}>{item.q2_duration_weeks} wks</td>
                                                <td style={{ padding: '12px' }}>{item.q6_mood}/10</td>
                                                <td style={{ padding: '12px' }}>{item.q7_stress_level}/10</td>
                                                <td style={{ padding: '12px', fontWeight: '600' }}>{item.predicted_disorder || 'Pending'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                                <i className="ti ti-history" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></i>
                                No previous assessment records found.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}