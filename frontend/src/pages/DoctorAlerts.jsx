import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorAlerts, updateAlertStatus } from '../services/api';
import { toast } from '../App';

export default function DoctorAlerts() {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchAlerts = async () => {
            const res = await getDoctorAlerts();
            setAlerts(res.data);
        };
        fetchAlerts();
    }, []);

    const handleStatusUpdate = async (alertId, newStatus) => {
        try {
            await updateAlertStatus(alertId, newStatus);
            toast(`Alert marked as ${newStatus}`, 'success');
            // Remove from list or update UI
            setAlerts(alerts.map(a => a._id === alertId ? { ...a, status: newStatus } : a));
        } catch (error) {
            toast('Failed to update alert', 'error');
        }
    };

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

                <aside className={`sidebar sb-dark ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>CLINICIAN PORTAL</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item active">
                        <i className="ti ti-alert-triangle"></i> Alerts
                        {alerts.filter(a => a.status === 'Pending').length > 0 && <span className="sb-notif">{alerts.filter(a => a.status === 'Pending').length}</span>}
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main main-dark">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <div className="ptitle">Patient Alerts</div>
                            <div className="psub">High and Critical urgency assessments requiring your immediate review.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ background: 'var(--dk-bg2)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--dk-border)' }}>
                                <span style={{ fontSize: '13px', color: 'var(--dk-text)' }}>Critical:</span>
                                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--coral)', marginLeft: '8px' }}>
                                    {alerts.filter(a => a.assessment_id?.urgency_level === 'Critical').length}
                                </span>
                            </div>
                            <div style={{ background: 'var(--dk-bg2)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--dk-border)' }}>
                                <span style={{ fontSize: '13px', color: 'var(--dk-text)' }}>High:</span>
                                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--amber)', marginLeft: '8px' }}>
                                    {alerts.filter(a => a.assessment_id?.urgency_level === 'High').length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {alerts.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {alerts.map((alert) => {
                                const assessment = alert.assessment_id;
                                const patient = assessment?.patient_id;
                                const isCrit = assessment?.urgency_level === 'Critical';
                                const isHigh = assessment?.urgency_level === 'High';

                                // Only show High and Critical as per documentation FR-5
                                if (!isCrit && !isHigh) return null;

                                return (
                                    <div key={alert._id} style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        borderLeft: isCrit ? '5px solid #DC2626' : '5px solid #E8614D',
                                        background: isCrit ? 'rgba(220, 38, 38, 0.08)' : 'rgba(232, 97, 77, 0.08)',
                                        border: '1px solid rgba(220, 38, 38, 0.15)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '12px',
                                                        padding: '8px 16px',
                                                        fontWeight: '700',
                                                        background: isCrit ? 'rgba(220, 38, 38, 0.15)' : 'rgba(232, 97, 77, 0.15)',
                                                        color: isCrit ? '#DC2626' : '#E8614D',
                                                        borderRadius: '20px'
                                                    }}>
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: isCrit ? '#DC2626' : '#E8614D'
                                                        }}></span>
                                                        {assessment.urgency_level} URGENCY
                                                    </span>
                                                    <span style={{
                                                        background: alert.status === 'Pending' ? 'rgba(232, 97, 77, 0.2)' :
                                                            alert.status === 'Acknowledged' ? 'rgba(199, 132, 23, 0.2)' :
                                                                'rgba(52, 211, 153, 0.2)',
                                                        color: alert.status === 'Pending' ? '#E8614D' :
                                                            alert.status === 'Acknowledged' ? '#C78417' :
                                                                '#34D399',
                                                        fontSize: '12px',
                                                        padding: '8px 16px',
                                                        fontWeight: '600',
                                                        borderRadius: '20px'
                                                    }}>
                                                        {alert.status}
                                                    </span>
                                                </div>

                                                {patient && (
                                                    <h4 style={{
                                                        color: 'var(--dk-text)',
                                                        fontSize: '18px',
                                                        fontWeight: '700',
                                                        marginBottom: '8px'
                                                    }}>
                                                        {patient.first_name || ''} {patient.last_name || ''}. {patient.email || ''}
                                                    </h4>
                                                )}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                    gap: '12px',
                                                    marginBottom: '12px'
                                                }}>
                                                    <div style={{
                                                        background: 'var(--dk-bg2)',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--dk-border)'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: 'var(--dk-text)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                                                            AI Prediction
                                                        </div>
                                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--dk-text)' }}>
                                                            {assessment?.predicted_disorder || 'Unknown'}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        background: 'var(--dk-bg2)',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--dk-border)'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: 'var(--dk-text)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                                                            Confidence
                                                        </div>
                                                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--dk-accent)' }}>
                                                            {(assessment?.confidence_score * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        background: 'var(--dk-bg2)',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--dk-border)'
                                                    }}>
                                                        <div style={{ fontSize: '11px', color: 'var(--dk-text)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                                                            Triggered
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>
                                                            {new Date(alert.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'flex-start' }}>
                                                {alert.status === 'Pending' && (
                                                    <button
                                                        style={{
                                                            background: 'rgba(232, 97, 77, 0.15)',
                                                            color: '#E8614D',
                                                            border: '1px solid #E8614D',
                                                            padding: '10px 18px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleStatusUpdate(alert._id, 'Acknowledged')}
                                                    >
                                                        <i className="ti ti-check"></i> Acknowledge
                                                    </button>
                                                )}
                                                {alert.status !== 'Resolved' && (
                                                    <button
                                                        style={{
                                                            background: 'rgba(52, 211, 153, 0.15)',
                                                            color: '#34D399',
                                                            border: '1px solid #34D399',
                                                            padding: '10px 18px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleStatusUpdate(alert._id, 'Resolved')}
                                                    >
                                                        <i className="ti ti-check-circle"></i> Resolve
                                                    </button>
                                                )}
                                                {patient && (
                                                    <button
                                                        style={{
                                                            padding: '10px 18px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                        className="btn btn-sm btn-dl"
                                                        onClick={() => navigate(`/doctor/patient/${patient._id}`)}
                                                    >
                                                        <i className="ti ti-user"></i> View Patient
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card" style={{
                            textAlign: 'center',
                            padding: '80px 40px',
                            background: 'var(--dk-bg2)',
                            border: '2px dashed var(--dk-border)'
                        }}>
                            <i className="ti ti-checklist" style={{
                                fontSize: '64px',
                                color: 'var(--dk-accent)',
                                marginBottom: '20px',
                                display: 'block'
                            }}></i>
                            <h3 style={{ color: 'var(--dk-text)', fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                                All Clear!
                            </h3>
                            <p style={{ color: 'var(--dk-text)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                                No high or critical alerts at the moment. Your patients are doing well.
                            </p>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}