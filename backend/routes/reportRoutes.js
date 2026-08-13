const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Assessment = require('../models/Assessment');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');

// All routes require authentication
router.use(protect);

// Helper function to convert Map to plain object
const convertMapToObject = (map) => {
    if (!map) return {};
    if (map instanceof Map) {
        return Object.fromEntries(map.entries());
    }
    return map;
};

// @desc    Generate Individual Patient Report
// @route   POST /api/reports/individual
router.post('/individual', async (req, res) => {
    try {
        const { patient_id, start_date, end_date, report_name } = req.body;

        if (!patient_id || !start_date || !end_date) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Verify patient belongs to this doctor
        const patient = await Patient.findOne({
            _id: patient_id,
            assigned_doctor: req.user._id
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found or not assigned to you' });
        }

        // Get assessments within date range
        const assessments = await Assessment.find({
            patient_id: patient_id,
            created_at: {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            }
        }).sort({ created_at: -1 });

        // Generate summary statistics
        const summary = {
            total_assessments: assessments.length,
            average_mood_score: assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.q6_mood, 0) / assessments.length)
                : 0,
            average_stress_level: assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.q7_stress_level, 0) / assessments.length)
                : 0,
            predicted_disorder_distribution: {},
            urgency_level_distribution: {},
            therapy_suggestions: {}
        };

        // Calculate disorder distribution
        assessments.forEach(assessment => {
            summary.predicted_disorder_distribution[assessment.predicted_disorder] =
                (summary.predicted_disorder_distribution[assessment.predicted_disorder] || 0) + 1;
        });

        // Calculate urgency distribution
        assessments.forEach(assessment => {
            summary.urgency_level_distribution[assessment.urgency_level] =
                (summary.urgency_level_distribution[assessment.urgency_level] || 0) + 1;
        });

        // Calculate therapy suggestions
        assessments.forEach(assessment => {
            summary.therapy_suggestions[assessment.suggested_therapy] =
                (summary.therapy_suggestions[assessment.suggested_therapy] || 0) + 1;
        });

        // Create report
        const report = await Report.create({
            doctor_id: req.user._id,
            report_type: 'individual',
            patient_id: patient_id,
            patient_ids: [],
            date_range: {
                start_date: new Date(start_date),
                end_date: new Date(end_date)
            },
            summary: summary,
            assessment_data: assessments.map(a => ({
                assessment_id: a._id,
                patient_id: a.patient_id,
                assessment_date: a.created_at,
                symptoms: a.q1_symptoms,
                duration_weeks: a.q2_duration_weeks,
                previous_diagnosis: a.q3_previous_diagnosis,
                therapy_history: a.q4_therapy_history,
                medication: a.q5_medication,
                mood_score: a.q6_mood,
                stress_level: a.q7_stress,
                predicted_disorder: a.predicted_disorder,
                urgency_level: a.urgency_level,
                suggested_therapy: a.suggested_therapy,
                self_care_advice: a.self_care_advice,
                confidence_score: a.confidence_score
            })),
            report_name: report_name || `Report for ${patient.first_name} ${patient.last_name}`
        });

        res.status(201).json({
            message: 'Individual report generated successfully',
            report
        });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Generate Bulk Report for Multiple Patients
// @route   POST /api/reports/bulk
router.post('/bulk', async (req, res) => {
    try {
        const { patient_ids, start_date, end_date, report_name } = req.body;

        if (!patient_ids || !Array.isArray(patient_ids) || patient_ids.length === 0) {
            return res.status(400).json({ message: 'Please provide at least one patient ID' });
        }

        if (!start_date || !end_date) {
            return res.status(400).json({ message: 'Please provide date range' });
        }

        // Verify all patients belong to this doctor
        const patients = await Patient.find({
            _id: { $in: patient_ids },
            assigned_doctor: req.user._id
        });

        if (patients.length !== patient_ids.length) {
            return res.status(404).json({ message: 'Some patients not found or not assigned to you' });
        }

        // Get all assessments within date range for all patients
        const assessments = await Assessment.find({
            patient_id: { $in: patient_ids },
            created_at: {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            }
        }).sort({ created_at: -1 });

        // Generate summary statistics
        const summary = {
            total_assessments: assessments.length,
            average_mood_score: assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.mood_score, 0) / assessments.length)
                : 0,
            average_stress_level: assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.stress_level, 0) / assessments.length)
                : 0,
            predicted_disorder_distribution: {},
            urgency_level_distribution: {},
            therapy_suggestions: {}
        };

        // Calculate disorder distribution
        assessments.forEach(assessment => {
            summary.predicted_disorder_distribution[assessment.predicted_disorder] =
                (summary.predicted_disorder_distribution[assessment.predicted_disorder] || 0) + 1;
        });

        // Calculate urgency distribution
        assessments.forEach(assessment => {
            summary.urgency_level_distribution[assessment.urgency_level] =
                (summary.urgency_level_distribution[assessment.urgency_level] || 0) + 1;
        });

        // Calculate therapy suggestions
        assessments.forEach(assessment => {
            summary.therapy_suggestions[assessment.suggested_therapy] =
                (summary.therapy_suggestions[assessment.suggested_therapy] || 0) + 1;
        });

        // Create report
        const report = await Report.create({
            doctor_id: req.user._id,
            report_type: 'bulk',
            patient_id: null,
            patient_ids: patient_ids,
            date_range: {
                start_date: new Date(start_date),
                end_date: new Date(end_date)
            },
            summary: summary,
            assessment_data: assessments.map(a => ({
                assessment_id: a._id,
                patient_id: a.patient_id,
                assessment_date: a.created_at,
                symptoms: a.q1_symptoms,
                duration_weeks: a.q2_duration_weeks,
                previous_diagnosis: a.q3_previous_diagnosis,
                therapy_history: a.q4_therapy_history,
                medication: a.q5_medication,
                mood_score: a.q6_mood,
                stress_level: a.q7_stress,
                predicted_disorder: a.predicted_disorder,
                urgency_level: a.urgency_level,
                suggested_therapy: a.suggested_therapy,
                self_care_advice: a.self_care_advice,
                confidence_score: a.confidence_score
            })),
            report_name: report_name || `Bulk Report - ${new Date().toLocaleDateString()}`
        });

        res.status(201).json({
            message: 'Bulk report generated successfully',
            report
        });

    } catch (error) {
        console.error('Bulk report generation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Get All Reports for Current Doctor
// @route   GET /api/reports
router.get('/', async (req, res) => {
    try {
        const reports = await Report.find({ doctor_id: req.user._id })
            .sort({ created_at: -1 })
            .populate('patient_id', 'first_name last_name email')
            .populate('patient_ids', 'first_name last_name email');

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Get Single Report by ID
// @route   GET /api/reports/:id
router.get('/:id', async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            doctor_id: req.user._id
        })
            .populate('patient_id', 'first_name last_name email')
            .populate('patient_ids', 'first_name last_name email');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Delete Report
// @route   DELETE /api/reports/:id
router.delete('/:id', async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            doctor_id: req.user._id
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        await report.deleteOne();
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Generate PDF Report
// @route   GET /api/reports/:id/pdf
router.get('/:id/pdf', async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            doctor_id: req.user._id
        })
            .populate('patient_id', 'first_name last_name email')
            .populate('patient_ids', 'first_name last_name email');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Convert Maps to plain objects for display
        const disorderDistribution = convertMapToObject(report.summary.predicted_disorder_distribution);
        const urgencyDistribution = convertMapToObject(report.summary.urgency_level_distribution);
        const therapySuggestions = convertMapToObject(report.summary.therapy_suggestions);

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Set response headers
        const filename = `${report.report_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add MindCare AI branding
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#0066cc');
        doc.text('MindCare AI', { align: 'center' });
        doc.fontSize(14).font('Helvetica').fillColor('#333333');
        doc.text('Mental Health Report', { align: 'center' });
        doc.moveDown();

        // Add separator line
        doc.strokeColor('#0066cc').lineWidth(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y);
        doc.stroke();
        doc.moveDown();

        // Add report information
        doc.fontSize(12).font('Helvetica').fillColor('#666666');
        doc.text(`Report ID: ${report._id}`, { align: 'left' });
        doc.text(`Generated: ${new Date(report.created_at).toLocaleString()}`, { align: 'left' });
        doc.text(`Report Type: ${report.report_type.toUpperCase()}`, { align: 'left' });
        doc.moveDown();

        // Add patient information
        if (report.report_type === 'individual' && report.patient_id) {
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
            doc.text('Patient Information', { align: 'left', underline: true });
            doc.moveDown();

            doc.fontSize(12).font('Helvetica').fillColor('#333333');
            doc.text(`Name: ${report.patient_id.first_name} ${report.patient_id.last_name}`, { align: 'left' });
            doc.text(`Email: ${report.patient_id.email}`, { align: 'left' });
            doc.moveDown();
        }

        if (report.report_type === 'bulk') {
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
            doc.text('Bulk Report', { align: 'left', underline: true });
            doc.moveDown();

            doc.fontSize(12).font('Helvetica').fillColor('#333333');
            doc.text(`Total Patients: ${report.patient_ids.length}`, { align: 'left' });
            doc.moveDown();

            report.patient_ids.forEach((patient, index) => {
                doc.text(`Patient ${index + 1}: ${patient.first_name} ${patient.last_name}`, { align: 'left' });
                doc.text(`Email: ${patient.email}`, { align: 'left' });
                doc.moveDown();
            });
        }

        // Add date range
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
        doc.text('Date Range', { align: 'left', underline: true });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica').fillColor('#333333');
        doc.text(`Start Date: ${new Date(report.date_range.start_date).toLocaleDateString()}`, { align: 'left' });
        doc.text(`End Date: ${new Date(report.date_range.end_date).toLocaleDateString()}`, { align: 'left' });
        doc.moveDown();

        // Add summary statistics
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
        doc.text('Summary Statistics', { align: 'left', underline: true });
        doc.moveDown();

        // If no assessment data, fetch recent assessments and calculate statistics
        let assessments = report.assessment_data || [];
        if (assessments.length === 0) {
            const recentAssessments = await Assessment.find({
                patient_id: report.patient_id || report.patient_ids?.[0],
                created_at: {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }).sort({ created_at: -1 }).limit(5);

            if (recentAssessments.length > 0) {
                // Recalculate statistics from recent assessments
                const totalAssessments = recentAssessments.length;
                const averageMood = Math.round(recentAssessments.reduce((sum, a) => sum + a.q6_mood, 0) / totalAssessments);
                const averageStress = Math.round(recentAssessments.reduce((sum, a) => sum + a.q7_stress_level, 0) / totalAssessments);

                // Calculate distributions
                const disorderDistribution = {};
                const urgencyDistribution = {};
                const therapySuggestions = {};

                recentAssessments.forEach(a => {
                    disorderDistribution[a.predicted_disorder] = (disorderDistribution[a.predicted_disorder] || 0) + 1;
                    urgencyDistribution[a.urgency_level] = (urgencyDistribution[a.urgency_level] || 0) + 1;
                    therapySuggestions[a.suggested_therapy] = (therapySuggestions[a.suggested_therapy] || 0) + 1;
                });

                doc.fontSize(12).font('Helvetica').fillColor('#333333');
                doc.text(`Total Assessments: ${totalAssessments}`, { align: 'left' });
                doc.text(`Average Mood Score: ${averageMood}/10`, { align: 'left' });
                doc.text(`Average Stress Level: ${averageStress}/10`, { align: 'left' });
                doc.moveDown();

                // Add disorder distribution
                if (Object.keys(disorderDistribution).length > 0) {
                    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
                    doc.text('Predicted Disorder Distribution', { align: 'left', underline: true });
                    doc.moveDown();

                    doc.fontSize(12).font('Helvetica').fillColor('#333333');
                    Object.entries(disorderDistribution).forEach(([disorder, count]) => {
                        const percentage = Math.round((count / totalAssessments) * 100);
                        doc.text(`${disorder}: ${count} (${percentage}%)`, { align: 'left' });
                    });
                    doc.moveDown();
                }

                // Add urgency distribution
                if (Object.keys(urgencyDistribution).length > 0) {
                    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
                    doc.text('Urgency Level Distribution', { align: 'left', underline: true });
                    doc.moveDown();

                    doc.fontSize(12).font('Helvetica').fillColor('#333333');
                    Object.entries(urgencyDistribution).forEach(([urgency, count]) => {
                        const percentage = Math.round((count / totalAssessments) * 100);
                        doc.text(`${urgency}: ${count} (${percentage}%)`, { align: 'left' });
                    });
                    doc.moveDown();
                }

                // Add therapy suggestions
                if (Object.keys(therapySuggestions).length > 0) {
                    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
                    doc.text('Therapy Suggestions', { align: 'left', underline: true });
                    doc.moveDown();

                    doc.fontSize(12).font('Helvetica').fillColor('#333333');
                    Object.entries(therapySuggestions).forEach(([therapy, count]) => {
                        doc.text(`${therapy}: ${count} times recommended`, { align: 'left' });
                    });
                    doc.moveDown();
                }
            } else {
                doc.fontSize(12).font('Helvetica').fillColor('#999999');
                doc.text('No assessments found in the database.', { align: 'left' });
                doc.moveDown();
            }
        } else {
            // Use original report statistics
            doc.fontSize(12).font('Helvetica').fillColor('#333333');
            doc.text(`Total Assessments: ${report.summary.total_assessments}`, { align: 'left' });
            doc.text(`Average Mood Score: ${report.summary.average_mood_score}/10`, { align: 'left' });
            doc.text(`Average Stress Level: ${report.summary.average_stress_level}/10`, { align: 'left' });
            doc.moveDown();

            // Add disorder distribution
            if (Object.keys(disorderDistribution).length > 0) {
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
                doc.text('Predicted Disorder Distribution', { align: 'left', underline: true });
                doc.moveDown();

                doc.fontSize(12).font('Helvetica').fillColor('#333333');
                Object.entries(disorderDistribution).forEach(([disorder, count]) => {
                    const percentage = report.summary.total_assessments > 0
                        ? Math.round((count / report.summary.total_assessments) * 100)
                        : 0;
                    doc.text(`${disorder}: ${count} (${percentage}%)`, { align: 'left' });
                });
                doc.moveDown();
            }

            // Add urgency distribution
            if (Object.keys(urgencyDistribution).length > 0) {
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
                doc.text('Urgency Level Distribution', { align: 'left', underline: true });
                doc.moveDown();

                doc.fontSize(12).font('Helvetica').fillColor('#333333');
                Object.entries(urgencyDistribution).forEach(([urgency, count]) => {
                    const percentage = report.summary.total_assessments > 0
                        ? Math.round((count / report.summary.total_assessments) * 100)
                        : 0;
                    doc.text(`${urgency}: ${count} (${percentage}%)`, { align: 'left' });
                });
                doc.moveDown();
            }

            // Add therapy suggestions
            if (Object.keys(therapySuggestions).length > 0) {
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#0066cc');
                doc.text('Therapy Suggestions', { align: 'left', underline: true });
                doc.moveDown();

                doc.fontSize(12).font('Helvetica').fillColor('#333333');
                Object.entries(therapySuggestions).forEach(([therapy, count]) => {
                    doc.text(`${therapy}: ${count} times recommended`, { align: 'left' });
                });
                doc.moveDown();
            }
        }

        // Add footer
        doc.fontSize(10).font('Helvetica').fillColor('#999999');
        doc.text('Generated by MindCare AI System', { align: 'center' });
        doc.text('© 2024 MindCare AI', { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;