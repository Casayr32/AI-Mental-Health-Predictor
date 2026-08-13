import api from './api';

export const generateIndividualReport = async (patient_id, start_date, end_date, report_name) => {
    const response = await api.post('/reports/individual', {
        patient_id,
        start_date,
        end_date,
        report_name
    });
    return response.data;
};

export const generateBulkReport = async (patient_ids, start_date, end_date, report_name) => {
    const response = await api.post('/reports/bulk', {
        patient_ids,
        start_date,
        end_date,
        report_name
    });
    return response.data;
};

export const getAllReports = async () => {
    const response = await api.get('/reports');
    return response.data;
};

export const getReportById = async (reportId) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
};

export const deleteReport = async (reportId) => {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
};

export const downloadReportPDF = async (reportId) => {
    try {
        const response = await api.get(`/reports/${reportId}/pdf`, {
            responseType: 'blob'
        });

        // Create a blob URL for the PDF
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Get report name from response headers
        const disposition = response.headers['content-disposition'];
        let filename = `report_${reportId}.pdf`;

        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        console.error('PDF download error:', error);
        return { success: false, error: error.message };
    }
};