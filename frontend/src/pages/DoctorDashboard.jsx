import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPatients, getDoctorAlerts, getDoctorAssessments } from '../services/api';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) setUser(savedUser);

        const fetchData = async () => {
            const patRes = await getDoctorPatients();
            setPatients(patRes.data);

            const alertRes = await getDoctorAlerts();
            setAlerts(alertRes.data);

            const assessRes = await getDoctorAssessments();
            setAssessments(assessRes.data || []);
        };
        fetchData();
    }, []);

    const pendingAlerts = alerts.filter(a => a.status === 'Pending').length;

    // Calculate Risk Distribution from Assessments
    const riskDistribution = {
        low: assessments.filter(a => a.urgency_level === 'Low').length,
        medium: assessments.filter(a => a.urgency_level === 'Moderate').length,
        high: assessments.filter(a => a.urgency_level === 'High').length,
        critical: assessments.filter(a => a.urgency_level === 'Critical').length
    };

    // Calculate Disorder Breakdown from Assessments
    const disorderBreakdown = {
        'None': assessments.filter(a => a.q3_previous_diagnosis === 'None').length,
        'OCD': assessments.filter(a => a.q3_previous_diagnosis === 'OCD').length,
        'PTSD': assessments.filter(a => a.q3_previous_diagnosis === 'PTSD').length,
        'Bipolar Disorder': assessments.filter(a => a.q3_previous_diagnosis === 'Bipolar Disorder').length,
        'Anxiety': assessments.filter(a => a.q3_previous_diagnosis === 'Anxiety').length,
        'Depression': assessments.filter(a => a.q3_previous_diagnosis === 'Depression').length
    };

    const getMaxValue = (obj) => Math.max(...Object.values(obj));

    const getInitials = (name) => {
        return `${name?.charAt(0) || ''}${name?.split(' ')[1]?.charAt(0) || ''}`;
    };

    const filteredPatients = patients.filter(patient =>
        patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                {/* Dark Sidebar */}
                <aside className={`sidebar sb-dark ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>CLINICIAN PORTAL</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item active"><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/alerts'); setSidebarOpen(false); }}>
                        <i className="ti ti-alert-triangle"></i> Alerts
                        {pendingAlerts > 0 && <span className="sb-notif">{pendingAlerts}</span>}
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor-reports'); setSidebarOpen(false); }}>
                        <i className="ti ti-file-text"></i> Reports
                    </div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                {/* Dark Main Content */}
                <main className="main main-dark">
                    <div className="ptitle">Welcome, Dr. {user?.first_name} {user?.middle_name} {user?.last_name}</div>
                    <div className="psub">Overview of your assigned patients and critical alerts.</div>

                    {/* Metrics Row - Larger Panels */}
                    <div className="metric-row" style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div className="metric" style={{
                            padding: '32px',
                            height: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            background: 'var(--dk-bg2)',
                            border: '1px solid var(--dk-border)',
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, var(--dk-accent), #8B5CF6)'
                            }}></div>
                            <div className="metric-label" style={{ fontSize: '15px', marginBottom: '16px', opacity: 0.8 }}>Assigned Patients</div>
                            <div className="metric-val" style={{
                                color: 'var(--dk-accent)',
                                fontSize: '56px',
                                fontWeight: '800',
                                lineHeight: '1',
                                margin: '0'
                            }}>{patients.length}</div>
                            <div className="metric-change" style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>Under your care</div>
                        </div>
                        <div className="metric" style={{
                            padding: '32px',
                            height: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            background: 'var(--dk-bg2)',
                            border: '1px solid var(--dk-border)',
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: pendingAlerts > 0 ? 'linear-gradient(90deg, var(--coral), #F59E0B)' : 'linear-gradient(90deg, #10B981, #3B82F6)'
                            }}></div>
                            <div className="metric-label" style={{ fontSize: '15px', marginBottom: '16px', opacity: 0.8 }}>Pending Alerts</div>
                            <div className="metric-val" style={{
                                color: pendingAlerts > 0 ? 'var(--coral)' : 'var(--dk-accent)',
                                fontSize: '56px',
                                fontWeight: '800',
                                lineHeight: '1',
                                margin: '0'
                            }}>{pendingAlerts}</div>
                            <div className="metric-change" style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>{pendingAlerts > 0 ? 'Requires immediate action' : 'All clear'}</div>
                        </div>
                        <div className="metric" style={{
                            padding: '32px',
                            height: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            background: 'var(--dk-bg2)',
                            border: '1px solid var(--dk-border)',
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(90deg, var(--blue), #06B6D4)'
                            }}></div>
                            <div className="metric-label" style={{ fontSize: '15px', marginBottom: '16px', opacity: 0.8 }}>Total Assessments</div>
                            <div className="metric-val" style={{
                                color: 'var(--blue)',
                                fontSize: '56px',
                                fontWeight: '800',
                                lineHeight: '1',
                                margin: '0'
                            }}>
                                {alerts.length}
                            </div>
                            <div className="metric-change" style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>Generated by AI</div>
                        </div>
                    </div>

                    {/* Analytics Panels - Risk Distribution & Disorder Breakdown */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        {/* Risk Distribution Panel */}
                        <div style={{
                            background: 'var(--dk-bg2)',
                            border: '1px solid var(--dk-border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: 'var(--dk-text)',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <i className="ti ti-alert-circle" style={{ fontSize: '20px' }}></i>
                                Risk Distribution
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.entries(riskDistribution).map(([label, count]) => {
                                    const max = getMaxValue(riskDistribution);
                                    const percentage = (count / max) * 100;
                                    const colorClass = label === 'Low' ? 'bg-green' :
                                        label === 'Medium' ? 'bg-amber' :
                                            label === 'High' ? 'bg-orange' : 'bg-red';

                                    return (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                                            <span style={{
                                                color: 'var(--dk-text)',
                                                fontWeight: '500',
                                                textAlign: 'right',
                                                padding: '0 12px',
                                                minWidth: '100px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>{label}</span>
                                            <div style={{
                                                flex: 1,
                                                background: 'var(--dk-bg)',
                                                height: '26px',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                marginRight: '12px'
                                            }}>
                                                <div className={`bar ${colorClass}`} style={{
                                                    height: '100%',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    paddingLeft: '8px',
                                                    color: '#ffffff',
                                                    fontWeight: '600',
                                                    fontSize: '12px',
                                                    width: `${percentage}%`,
                                                    transition: 'width 0.4s ease'
                                                }}>
                                                    {count}
                                                </div>
                                            </div>
                                            <span style={{
                                                width: '40px',
                                                textAlign: 'right',
                                                color: 'var(--dk-text)',
                                                fontWeight: '500'
                                            }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Disorder Breakdown Panel */}
                        <div style={{
                            background: 'var(--dk-bg2)',
                            border: '1px solid var(--dk-border)',
                            borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: 'var(--dk-text)',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <i className="ti ti-brain" style={{ fontSize: '20px' }}></i>
                                Disorder Breakdown
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.entries(disorderBreakdown).map(([label, count]) => {
                                    const max = getMaxValue(disorderBreakdown);
                                    const percentage = (count / max) * 100;
                                    const colorClass = label === 'None' ? 'bg-teal' :
                                        label === 'Bipolar Disorder' ? 'bg-orange' :
                                            label === 'Anxiety' ? 'bg-purple' :
                                                label === 'Depression' ? 'bg-blue' :
                                                    label === 'PTSD' ? 'bg-red' : 'bg-yellow';

                                    return (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                                            <span style={{
                                                color: 'var(--dk-text)',
                                                fontWeight: '500',
                                                textAlign: 'right',
                                                padding: '0 12px',
                                                minWidth: '140px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>{label}</span>
                                            <div style={{
                                                flex: 1,
                                                background: 'var(--dk-bg)',
                                                height: '26px',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                marginRight: '12px'
                                            }}>
                                                <div className={`bar ${colorClass}`} style={{
                                                    height: '100%',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    paddingLeft: '8px',
                                                    color: '#ffffff',
                                                    fontWeight: '600',
                                                    fontSize: '12px',
                                                    width: `${percentage}%`,
                                                    transition: 'width 0.4s ease'
                                                }}>
                                                    {count}
                                                </div>
                                            </div>
                                            <span style={{
                                                width: '40px',
                                                textAlign: 'right',
                                                color: 'var(--dk-text)',
                                                fontWeight: '500'
                                            }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Patient Grid (Dark Theme Cards) - Larger Panels */}
                    <div className="card" style={{
                        marginBottom: '30px',
                        padding: '24px',
                        background: 'var(--dk-bg2)',
                        border: '1px solid var(--dk-border)',
                        borderRadius: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--dk-text)' }}>
                                <i className="ti ti-users" style={{ marginRight: '8px' }}></i> My Patients
                            </h3>
                            <div className="search-wrap" style={{ maxWidth: '500px', flex: 1, minWidth: '300px' }}>
                                <i className="ti ti-search"></i>
                                <input
                                    className="fi"
                                    type="text"
                                    placeholder="Search patients by name or email..."
                                    style={{
                                        background: 'var(--dk-bg)',
                                        borderColor: 'var(--dk-border)',
                                        color: 'var(--dk-text)',
                                        padding: '12px 16px'
                                    }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {filteredPatients.length > 0 ? (
                            <div className="pat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {filteredPatients.map(pat => (
                                    <div className="pat-card" key={pat._id} onClick={() => navigate(`/doctor/patient/${pat._id}`)} style={{
                                        padding: '20px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: pat.status === 'Active' ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, var(--coral), #F59E0B)'
                                        }}></div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div className="av av-pri" style={{
                                                background: pat.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: pat.status === 'Active' ? 'var(--dk-accent)' : 'var(--coral)',
                                                width: '50px',
                                                height: '50px',
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {getInitials(pat.first_name + ' ' + pat.last_name)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="pat-card-name" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--dk-text)', marginBottom: '4px' }}>
                                                    {pat.first_name} {pat.last_name}
                                                </div>
                                                <div className="pat-card-sub" style={{ fontSize: '13px', color: 'var(--dk-text)', opacity: 0.7, marginBottom: '8px' }}>
                                                    {pat.email}
                                                </div>
                                                <div className="pat-card-meta" style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <i className="ti ti-calendar" style={{ fontSize: '12px' }}></i>
                                                        {new Date(pat.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        background: pat.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: pat.status === 'Active' ? '#10B981' : '#EF4444'
                                                    }}>
                                                        <i className="ti ti-circle" style={{ fontSize: '8px', verticalAlign: 'middle', marginRight: '4px' }}></i>
                                                        {pat.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 40px',
                                background: 'var(--dk-bg)',
                                border: '2px dashed var(--dk-border)',
                                borderRadius: '12px'
                            }}>
                                <i className="ti ti-users" style={{
                                    fontSize: '64px',
                                    color: 'var(--dk-text)',
                                    opacity: 0.3,
                                    marginBottom: '16px',
                                    display: 'block'
                                }}></i>
                                <p style={{ color: 'var(--dk-text)', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                                    {searchTerm ? 'No patients found matching your search.' : 'No patients assigned to you yet.'}
                                </p>
                                <p style={{ color: 'var(--dk-text)', opacity: 0.6, fontSize: '14px', margin: 0 }}>
                                    {searchTerm ? 'Try adjusting your search terms' : 'Start by adding new patients to your care'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* CSS Styles for Analytics Panels */}
                    <style jsx>{`
                        .bar {
                            transition: width 0.4s ease;
                        }

                        /* Risk Colors */
                        .bg-green { background-color: #10b981; }
                        .bg-amber { background-color: #d97706; }
                        .bg-orange { background-color: #ea580c; }
                        .bg-red { background-color: #ef4444; }

                        /* Disorder Colors */
                        .bg-teal { background-color: #0d9488; }
                        .bg-purple { background-color: #8b5cf6; }
                        .bg-blue { background-color: #3b82f6; }
                        .bg-yellow { background-color: #eab308; }
                    `}</style>

                </main>
            </div>
        </div>
    );
}