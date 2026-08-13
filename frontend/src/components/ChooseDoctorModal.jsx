import { useState, useEffect } from 'react';
import { getAvailableDoctors, assignDoctor } from '../services/api';

const toast = (msg, type = 'info') => {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="ti ti-${type === 'success' ? 'check' : type === 'error' ? 'x' : 'info-circle'}"></i> ${msg}`;
    box.appendChild(t);
    setTimeout(() => {
        t.classList.add('out');
        setTimeout(() => t.remove(), 300);
    }, 3000);
};

export default function ChooseDoctorModal({ onDoctorAssigned }) {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await getAvailableDoctors();
                const list = Array.isArray(res?.data) ? res.data : [];
                setDoctors(list);
            } catch (error) {
                // 401-ka iyo logout-ka waa api.js ku haysta, halkan is dhaaf
                console.error('Failed to fetch doctors:', error);
                toast('Failed to load available clinicians. Please try refreshing.', 'error');
                setDoctors([]);
            }
        };
        fetchDoctors();
    }, []);

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedDoc) return toast('Please select a clinician to continue.', 'warning');

        try {
            setLoading(true);
            await assignDoctor(selectedDoc);

            const selectedDoctorObj = doctors.find(d => d._id === selectedDoc);

            if (selectedDoctorObj && onDoctorAssigned) {
                onDoctorAssigned({
                    assigned_doctor: {
                        _id: selectedDoctorObj._id,
                        first_name: selectedDoctorObj.first_name,
                        last_name: selectedDoctorObj.last_name,
                        specialisation: selectedDoctorObj.specialisation,
                        full_name: `Dr. ${selectedDoctorObj.first_name} ${selectedDoctorObj.last_name}`
                    }
                });
            }

            toast('Clinician assigned successfully! You may now proceed.', 'success');
        } catch (error) {
            console.error('Assign doctor failed:', error);
            toast(error?.response?.data?.message || 'Failed to assign clinician.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-ov open" style={{ display: 'flex' }}>
            <div className="modal-box" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="modal-hd">
                    <h3>Assign a Clinician</h3>
                    <div className="modal-x" style={{ cursor: 'not-allowed', opacity: 0.5 }}>
                        <i className="ti ti-x"></i>
                    </div>
                </div>
                <div className="modal-bd">
                    <div className="card" style={{ background: '#EFF8F4', borderColor: '#B6E5D2', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--pri-dark)', marginBottom: '16px' }}>
                        <i className="ti ti-alert-triangle" style={{ fontSize: '18px' }}></i>
                        <span>You must select a clinician before proceeding with your mental health assessment.</span>
                    </div>
                    <form onSubmit={handleAssign}>
                        <div className="fg">
                            <label className="fl">Select Available Clinician</label>
                            <select className="fi" value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)} required>
                                <option value="" disabled>-- Choose a Clinician --</option>
                                {doctors.map((doc) => (
                                    <option key={doc._id} value={doc._id}>
                                        Dr. {doc.first_name} {doc.last_name}
                                        {doc.specialisation ? ` (${doc.specialisation})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </form>
                </div>
                <div className="modal-ft">
                    <button type="submit" className="btn btn-pri" onClick={handleAssign} disabled={loading || !selectedDoc}>
                        {loading ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}