import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    generateIndividualReport,
    generateBulkReport,
    getAllReports,
    deleteReport
} from '../services/reportService';
import { getDoctorPatients } from '../services/api';
import { downloadReportPDF } from '../services/reportService';
import { toast } from '../App';

const DoctorReports = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reports, setReports] = useState([]);
    const [selectedPatients, setSelectedPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportName, setReportName] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showIndividualModal, setShowIndividualModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchReports();
        fetchPatients();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await getAllReports();
            setReports(response);
        } catch (error) {
            toast('Failed to load reports', 'error');
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await getDoctorPatients();
            setPatients(response.data || []);
        } catch (error) {
            console.error('Failed to load patients:', error);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleGenerateIndividual = async (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            toast('Please select date range', 'error');
            return;
        }

        setLoading(true);
        try {
            await generateIndividualReport(
                e.target.patient_id.value,
                startDate,
                endDate,
                reportName || 'Individual Report'
            );
            toast('Individual report generated successfully!', 'success');
            setReportName('');
            setShowIndividualModal(false);
            fetchReports();
        } catch (error) {
            toast('Failed to generate report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBulk = async (e) => {
        e.preventDefault();
        if (selectedPatients.length === 0) {
            toast('Please select at least one patient', 'error');
            return;
        }
        if (!startDate || !endDate) {
            toast('Please select date range', 'error');
            return;
        }

        setLoading(true);
        try {
            await generateBulkReport(
                selectedPatients,
                startDate,
                endDate,
                reportName || 'Bulk Report'
            );
            toast('Bulk report generated successfully!', 'success');
            setReportName('');
            setSelectedPatients([]);
            setShowBulkModal(false);
            fetchReports();
        } catch (error) {
            toast('Failed to generate bulk report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return;
        }

        try {
            await deleteReport(reportId);
            toast('Report deleted successfully', 'success');
            fetchReports();
        } catch (error) {
            toast('Failed to delete report', 'error');
        }
    };

    const handleDownloadPDF = async (reportId) => {
        try {
            await downloadReportPDF(reportId);
            toast('PDF downloaded successfully!', 'success');
        } catch (error) {
            toast('Failed to download PDF', 'error');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
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
                <aside className={`sidebar sb-dark ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>CLINICIAN PORTAL</span></div>
                    <div className="sb-sec">Reports</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/alerts'); setSidebarOpen(false); }}><i className="ti ti-alert-triangle"></i> Alerts</div>
                    <div className="sb-item active"><i className="ti ti-file-text"></i> Reports</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main main-dark">
                    <div style={{ padding: '30px 40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h1 style={{ color: 'var(--dk-text)', fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0' }}>
                                    Patient Reports
                                </h1>
                                <p style={{ color: 'var(--dk-text)', fontSize: '14px', margin: 0, opacity: 0.7 }}>
                                    Generate and manage comprehensive patient assessment reports
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowIndividualModal(true)}
                                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600' }}
                                >
                                    <i className="ti ti-plus"></i> Generate Individual
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowBulkModal(true)}
                                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600' }}
                                >
                                    <i className="ti ti-users"></i> Generate Bulk
                                </button>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`} style={{
                                padding: '14px 20px',
                                margin: '0 0 24px 0',
                                borderRadius: '10px',
                                fontWeight: '500',
                                fontSize: '14px'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{
                                    background: 'var(--dk-bg2)',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--dk-border)',
                                    flex: 1,
                                    minWidth: '200px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                                        Total Reports
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--dk-accent)' }}>
                                        {reports.length}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'var(--dk-bg2)',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--dk-border)',
                                    flex: 1,
                                    minWidth: '200px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                                        Individual Reports
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#3B82F6' }}>
                                        {reports.filter(r => r.report_type === 'individual').length}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'var(--dk-bg2)',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--dk-border)',
                                    flex: 1,
                                    minWidth: '200px'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                                        Bulk Reports
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#8B5CF6' }}>
                                        {reports.filter(r => r.report_type === 'bulk').length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {reports.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '80px 40px',
                                background: 'var(--dk-bg2)',
                                border: '2px dashed var(--dk-border)',
                                borderRadius: '20px'
                            }}>
                                <i className="ti ti-file-text" style={{
                                    fontSize: '64px',
                                    color: 'var(--dk-accent)',
                                    marginBottom: '24px',
                                    display: 'block'
                                }}></i>
                                <h3 style={{ color: 'var(--dk-text)', fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
                                    No Reports Yet
                                </h3>
                                <p style={{ color: 'var(--dk-text)', fontSize: '14px', opacity: 0.7, maxWidth: '400px', margin: '0 auto' }}>
                                    Generate your first patient report to get started
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                                {reports.map(report => (
                                    <div key={report._id} style={{
                                        background: 'var(--dk-bg2)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: report.report_type === 'individual' ? '#3B82F6' : '#8B5CF6'
                                        }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                            <div>
                                                <h3 style={{
                                                    color: 'var(--dk-text)',
                                                    fontSize: '18px',
                                                    fontWeight: '700',
                                                    margin: '0 0 8px 0',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {report.report_name}
                                                </h3>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    background: report.report_type === 'individual' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                                    color: report.report_type === 'individual' ? '#3B82F6' : '#8B5CF6'
                                                }}>
                                                    {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: 'var(--dk-bg)',
                                                borderRadius: '10px',
                                                marginBottom: '8px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.7 }}>
                                                    Date Range
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>
                                                    {formatDate(report.date_range.start_date)} - {formatDate(report.date_range.end_date)}
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: 'var(--dk-bg)',
                                                borderRadius: '10px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.7 }}>
                                                    Created
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>
                                                    {formatDateTime(report.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        {report.report_type === 'individual' && report.patient_id && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: 'var(--dk-bg)',
                                                borderRadius: '10px',
                                                marginBottom: '20px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.7 }}>
                                                    Patient
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>
                                                    {report.patient_id.first_name} {report.patient_id.last_name}
                                                </div>
                                            </div>
                                        )}

                                        {report.report_type === 'bulk' && report.patient_ids && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: 'var(--dk-bg)',
                                                borderRadius: '10px',
                                                marginBottom: '20px'
                                            }}>
                                                <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.7 }}>
                                                    Patients
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>
                                                    {report.patient_ids.length} patients
                                                </div>
                                            </div>
                                        )}

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: '8px',
                                            padding: '16px',
                                            background: 'var(--dk-bg)',
                                            borderRadius: '10px',
                                            marginBottom: '20px'
                                        }}>
                                            {/* <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '10px', color: 'var(--dk-text)', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700' }}>
                                                    Assessments
                                                </div>
                                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--dk-accent)' }}>
                                                    {report.summary.total_assessments}
                                                </div>
                                            </div> */}
                                            {/* <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '10px', color: 'var(--dk-text)', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700' }}>
                                                    Avg Mood
                                                </div>
                                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#10B981' }}>
                                                    {report.summary.average_mood_score}/10
                                                </div>
                                            </div> */}
                                            {/* <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '10px', color: 'var(--dk-text)', opacity: 0.6, textTransform: 'uppercase', fontWeight: '700' }}>
                                                    Avg Stress
                                                </div>
                                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#F59E0B' }}>
                                                    {report.summary.average_stress_level}/10
                                                </div>
                                            </div> */}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleDownloadPDF(report._id)}
                                                style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: '600' }}
                                            >
                                                <i className="ti ti-download"></i> Download PDF
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDeleteReport(report._id)}
                                                style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600' }}
                                            >
                                                <i className="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Bulk Report Modal */}
            {showBulkModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--dk-bg2)',
                        border: '1px solid var(--dk-border)',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'modalSlideIn 0.3s ease'
                    }}>
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid var(--dk-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ color: 'var(--dk-text)', fontSize: '22px', fontWeight: '700', margin: 0 }}>
                                Generate Bulk Report
                            </h2>
                            <button
                                onClick={() => setShowBulkModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '28px',
                                    color: 'var(--dk-text)',
                                    opacity: 0.6,
                                    cursor: 'pointer',
                                    lineHeight: '1',
                                    padding: '0 8px'
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleGenerateBulk} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    Select Patients
                                </label>
                                <select
                                    multiple
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        minHeight: '200px'
                                    }}
                                    value={selectedPatients}
                                    onChange={(e) => setSelectedPatients(
                                        Array.from(e.target.selectedOptions).map(option => option.value)
                                    )}
                                >
                                    <option value="">Select patients...</option>
                                    {patients.map(patient => (
                                        <option key={patient._id} value={patient._id}>
                                            {patient.first_name} {patient.last_name} ({patient.email})
                                        </option>
                                    ))}
                                </select>
                                <div style={{ fontSize: '12px', color: 'var(--dk-text)', opacity: 0.6, marginTop: '8px' }}>
                                    Hold Ctrl/Cmd to select multiple
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    Report Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Bulk Report"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    value={reportName}
                                    onChange={(e) => setReportName(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowBulkModal(false)}
                                    style={{ padding: '14px 24px', fontSize: '14px', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading || selectedPatients.length === 0}
                                    style={{ padding: '14px 24px', fontSize: '14px', fontWeight: '600' }}
                                >
                                    {loading ? 'Generating...' : 'Generate Bulk Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Individual Report Modal */}
            {showIndividualModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--dk-bg2)',
                        border: '1px solid var(--dk-border)',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'modalSlideIn 0.3s ease'
                    }}>
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid var(--dk-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ color: 'var(--dk-text)', fontSize: '22px', fontWeight: '700', margin: 0 }}>
                                Generate Individual Report
                            </h2>
                            <button
                                onClick={() => setShowIndividualModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '28px',
                                    color: 'var(--dk-text)',
                                    opacity: 0.6,
                                    cursor: 'pointer',
                                    lineHeight: '1',
                                    padding: '0 8px'
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleGenerateIndividual} style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    Select Patient
                                </label>
                                <select
                                    name="patient_id"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                >
                                    <option value="">Select a patient...</option>
                                    {patients.map(patient => (
                                        <option key={patient._id} value={patient._id}>
                                            {patient.first_name} {patient.last_name} ({patient.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--dk-text)', fontWeight: '600', fontSize: '14px' }}>
                                    Report Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Individual Report"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: 'var(--dk-bg)',
                                        border: '1px solid var(--dk-border)',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: 'var(--dk-text)',
                                        boxSizing: 'border-box'
                                    }}
                                    value={reportName}
                                    onChange={(e) => setReportName(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowIndividualModal(false)}
                                    style={{ padding: '14px 24px', fontSize: '14px', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                    style={{ padding: '14px 24px', fontSize: '14px', fontWeight: '600' }}
                                >
                                    {loading ? 'Generating...' : 'Generate Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .message {
                    padding: 14px 20px;
                    margin: 0 0 24px 0;
                    border-radius: 10px;
                    font-weight: 500;
                    font-size: 14px;
                }

                .message.success {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10B981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .message.error {
                    background: rgba(239, 68, 68, 0.15);
                    color: #EF4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: '8px';
                }

                .btn-primary {
                    background: var(--dk-accent);
                    color: white;
                    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
                }

                .btn-primary:hover {
                    background: #BE185D;
                    box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
                    transform: translateY(-2px);
                }

                .btn-secondary {
                    background: var(--dk-bg);
                    color: var(--dk-text);
                    border: 1px solid var(--dk-border);
                }

                .btn-secondary:hover {
                    background: var(--dk-border);
                    transform: translateY(-2px);
                }

                .btn-danger {
                    background: rgba(239, 68, 68, 0.15);
                    color: #EF4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .btn-danger:hover {
                    background: rgba(239, 68, 68, 0.25);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default DoctorReports;