import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getReportById } from '../services/reportService';

const DoctorPatientReport = () => {
    const { reportId } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchReport();
    }, [reportId]);

    const fetchReport = async () => {
        try {
            const response = await getReportById(reportId);
            setReport(response);
        } catch (error) {
            showMessage('error', 'Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'Critical': return '#dc3545';
            case 'High': return '#fd7e14';
            case 'Moderate': return '#ffc107';
            case 'Low': return '#28a745';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading report...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="error-container">
                <h2>Report not found</h2>
                <p>The requested report does not exist.</p>
            </div>
        );
    }

    return (
        <div className="report-detail-container">
            <div className="report-header">
                <div className="report-title">
                    <h1>{report.report_name}</h1>
                    <span className={`report-type ${report.report_type}`}>
                        {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report
                    </span>
                </div>
                <button className="btn-back" onClick={() => window.history.back()}>
                    ← Back to Reports
                </button>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Report Overview */}
            <div className="report-overview">
                <div className="overview-card">
                    <h3>Report Information</h3>
                    <div className="overview-grid">
                        <div className="overview-item">
                            <span className="label">Report Type:</span>
                            <span className="value">{report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Date Range:</span>
                            <span className="value">
                                {formatDate(report.date_range.start_date)} - {formatDate(report.date_range.end_date)}
                            </span>
                        </div>
                        <div className="overview-item">
                            <span className="label">Created At:</span>
                            <span className="value">{formatDateTime(report.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className="overview-card">
                    <h3>Summary Statistics</h3>
                    <div className="summary-grid">
                        <div className="stat-box">
                            <div className="stat-value">{report.summary.total_assessments}</div>
                            <div className="stat-label">Total Assessments</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{report.summary.average_mood_score}/10</div>
                            <div className="stat-label">Average Mood Score</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{report.summary.average_stress_level}/10</div>
                            <div className="stat-label">Average Stress Level</div>
                        </div>
                    </div>
                </div>

                {/* Disorder Distribution */}
                <div className="overview-card">
                    <h3>Predicted Disorder Distribution</h3>
                    <div className="distribution-list">
                        {Object.entries(report.summary.predicted_disorder_distribution || {}).map(([disorder, count]) => (
                            <div key={disorder} className="distribution-item">
                                <span className="disorder-name">{disorder}</span>
                                <span className="disorder-count">{count} times</span>
                                <div className="disorder-bar">
                                    <div
                                        className="disorder-fill"
                                        style={{ width: `${(count / report.summary.total_assessments) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Urgency Distribution */}
                <div className="overview-card">
                    <h3>Urgency Level Distribution</h3>
                    <div className="distribution-list">
                        {Object.entries(report.summary.urgency_level_distribution || {}).map(([urgency, count]) => (
                            <div key={urgency} className="distribution-item">
                                <span className="urgency-name">{urgency}</span>
                                <span className="urgency-count">{count} times</span>
                                <div className="urgency-bar">
                                    <div
                                        className="urgency-fill"
                                        style={{
                                            width: `${(count / report.summary.total_assessments) * 100}%`,
                                            backgroundColor: getUrgencyColor(urgency)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Therapy Suggestions */}
                <div className="overview-card">
                    <h3>Therapy Suggestions</h3>
                    <div className="distribution-list">
                        {Object.entries(report.summary.therapy_suggestions || {}).map(([therapy, count]) => (
                            <div key={therapy} className="distribution-item">
                                <span className="therapy-name">{therapy}</span>
                                <span className="therapy-count">{count} times</span>
                                <div className="therapy-bar">
                                    <div
                                        className="therapy-fill"
                                        style={{ width: `${(count / report.summary.total_assessments) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Assessment Data */}
            {report.assessment_data && report.assessment_data.length > 0 && (
                <div className="assessment-data-section">
                    <h2>Detailed Assessment Data</h2>
                    <div className="assessment-list">
                        {report.assessment_data.map((assessment, index) => (
                            <div key={index} className="assessment-card">
                                <div className="assessment-header">
                                    <h3>Assessment #{index + 1}</h3>
                                    <span className={`assessment-date`}>
                                        {formatDate(assessment.assessment_date)}
                                    </span>
                                </div>

                                <div className="assessment-body">
                                    <div className="assessment-grid">
                                        <div className="assessment-item">
                                            <span className="field-label">Symptoms:</span>
                                            <span className="field-value">{assessment.symptoms}</span>
                                        </div>
                                        <div className="assessment-item">
                                            <span className="field-label">Duration:</span>
                                            <span className="field-value">{assessment.duration_weeks} weeks</span>
                                        </div>
                                        <div className="assessment-item">
                                            <span className="field-label">Previous Diagnosis:</span>
                                            <span className="field-value">{assessment.previous_diagnosis}</span>
                                        </div>
                                        <div className="assessment-item">
                                            <span className="field-label">Therapy History:</span>
                                            <span className="field-value">{assessment.therapy_history}</span>
                                        </div>
                                        <div className="assessment-item">
                                            <span className="field-label">Medication:</span>
                                            <span className="field-value">{assessment.medication}</span>
                                        </div>
                                    </div>

                                    <div className="assessment-scores">
                                        <div className="score-item">
                                            <span className="score-label">Mood Score:</span>
                                            <span className="score-value">{assessment.mood_score}/10</span>
                                        </div>
                                        <div className="score-item">
                                            <span className="score-label">Stress Level:</span>
                                            <span className="score-value">{assessment.stress_level}/10</span>
                                        </div>
                                    </div>

                                    <div className="assessment-results">
                                        <div className="result-item">
                                            <span className="result-label">Predicted Disorder:</span>
                                            <span className="result-value">{assessment.predicted_disorder}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Urgency Level:</span>
                                            <span
                                                className="result-value urgency"
                                                style={{ color: getUrgencyColor(assessment.urgency_level) }}
                                            >
                                                {assessment.urgency_level}
                                            </span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Suggested Therapy:</span>
                                            <span className="result-value">{assessment.suggested_therapy}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Self-Care Advice:</span>
                                            <span className="result-value">{assessment.self_care_advice}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Confidence Score:</span>
                                            <span className="result-value">{assessment.confidence_score}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .loading-container, .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    color: #666;
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007bff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .report-detail-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .report-title h1 {
                    color: #333;
                    margin: 0 0 10px 0;
                    font-size: 28px;
                }

                .report-type {
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .report-type.individual {
                    background-color: #e7f3ff;
                    color: #007bff;
                }

                .report-type.bulk {
                    background-color: #f0f0f0;
                    color: #6c757d;
                }

                .btn-back {
                    padding: 10px 20px;
                    background-color: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.3s;
                }

                .btn-back:hover {
                    background-color: #545b62;
                }

                .message {
                    padding: 12px 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                    font-weight: 500;
                }

                .message.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .message.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .report-overview {
                    margin-bottom: 40px;
                }

                .overview-card {
                    background-color: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .overview-card h3 {
                    color: #333;
                    margin: 0 0 20px 0;
                    font-size: 20px;
                    border-bottom: 1px solid #e0e0e0;
                    padding-bottom: 10px;
                }

                .overview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }

                .overview-item {
                    display: flex;
                    flex-direction: column;
                }

                .label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                }

                .stat-box {
                    text-align: center;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }

                .stat-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: #007bff;
                    margin-bottom: 10px;
                }

                .stat-label {
                    font-size: 14px;
                    color: #666;
                }

                .distribution-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .distribution-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .disorder-name, .urgency-name, .therapy-name {
                    width: 200px;
                    font-weight: 500;
                    color: #333;
                }

                .disorder-count, .urgency-count, .therapy-count {
                    width: 80px;
                    text-align: right;
                    font-weight: 600;
                    color: #666;
                }

                .disorder-bar, .urgency-bar, .therapy-bar {
                    flex: 1;
                    height: 8px;
                    background-color: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .disorder-fill, .urgency-fill, .therapy-fill {
                    height: 100%;
                    background-color: #007bff;
                    transition: width 0.5s ease;
                }

                .urgency-fill {
                    background-color: #007bff;
                }

                .assessment-data-section {
                    margin-top: 40px;
                }

                .assessment-data-section h2 {
                    color: #333;
                    margin-bottom: 20px;
                    font-size: 24px;
                }

                .assessment-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .assessment-card {
                    background-color: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .assessment-header {
                    background-color: #f8f9fa;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #e0e0e0;
                }

                .assessment-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }

                .assessment-date {
                    font-size: 14px;
                    color: #666;
                    background-color: #e7f3ff;
                    padding: 5px 12px;
                    border-radius: 12px;
                }

                .assessment-body {
                    padding: 20px;
                }

                .assessment-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .assessment-item {
                    display: flex;
                    flex-direction: column;
                }

                .field-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .field-value {
                    font-size: 14px;
                    color: #333;
                    font-weight: 500;
                }

                .assessment-scores {
                    display: flex;
                    gap: 30px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }

                .score-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .score-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .score-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #007bff;
                }

                .assessment-results {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }

                .result-item {
                    display: flex;
                    flex-direction: column;
                }

                .result-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }

                .result-value {
                    font-size: 14px;
                    color: #333;
                    font-weight: 500;
                }

                .result-value.urgency {
                    font-weight: 700;
                }
            `}</style>
        </div>
    );
};

export default DoctorPatientReport;