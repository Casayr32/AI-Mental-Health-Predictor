import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    adminGetDoctors, adminUpdateDoctor, adminUpdateDoctorStatus, adminDeleteDoctor, adminCreateDoctor,
    adminGetPatients, adminUpdatePatient, adminUpdatePatientStatus, adminDeletePatient, adminCreatePatient
} from '../services/api';
import { toast } from '../App';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('doctors');
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); // 'edit-doctor', 'status-doctor', 'add-doctor', etc.
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchDoctors();
        fetchPatients();
    }, []);

    const fetchDoctors = async () => { const res = await adminGetDoctors(); setDoctors(res.data); };
    const fetchPatients = async () => { const res = await adminGetPatients(); setPatients(res.data); };

    // --- Modal Controls ---
    const openModal = (type, user = null) => {
        setModalType(type);
        setSelectedUser(user);
        if (user) {
            setFormData({ first_name: user.first_name, mid_name: user.mid_name || '', last_name: user.last_name, email: user.email, specialisation: user.specialisation || '' });
        } else {
            setFormData({ first_name: '', mid_name: '', last_name: '', email: '', password: '123456', specialisation: '', assigned_doctor: '' });
        }
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setSelectedUser(null); };

    // --- Action Handlers ---
    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        try {
            if (modalType.includes('doctor')) {
                await adminUpdateDoctor(selectedUser._id, formData);
            } else {
                await adminUpdatePatient(selectedUser._id, formData);
            }
            toast('Information updated successfully', 'success');
            closeModal(); fetchDoctors(); fetchPatients();
        } catch (error) { toast(error.response?.data?.message || 'Update failed', 'error'); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'add-doctor') await adminCreateDoctor(formData);
            else await adminCreatePatient(formData);
            toast('Account created successfully', 'success');
            closeModal(); fetchDoctors(); fetchPatients();
        } catch (error) { toast(error.response?.data?.message || 'Creation failed', 'error'); }
    };

    const handleStatusChange = async (newStatus) => {
        if (!newStatus) return;
        try {
            if (modalType.includes('doctor')) await adminUpdateDoctorStatus(selectedUser._id, newStatus);
            else await adminUpdatePatientStatus(selectedUser._id, newStatus);
            toast(`Status updated to ${newStatus}`, 'success');
            closeModal(); fetchDoctors(); fetchPatients();
        } catch (error) { toast(error.response?.data?.message || 'Status update failed', 'error'); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this account? This cannot be undone.')) return;
        try {
            if (modalType.includes('doctor')) await adminDeleteDoctor(selectedUser._id);
            else await adminDeletePatient(selectedUser._id);
            toast('Account permanently deleted', 'success');
            closeModal(); fetchDoctors(); fetchPatients();
        } catch (error) { toast(error.response?.data?.message || 'Delete failed', 'error'); }
    };

    const pendingDoctors = doctors.filter(d => d.account_status === 'Pending' || d.account_status === 'Approved').length;

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
                    <div className="sb-logo">MindCare AI<span>ADMIN CONTROL PANEL</span></div>
                    <div className="sb-sec">Management</div>
                    <div className="sb-item active"><i className="ti ti-shield-check"></i> Dashboard</div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main main-dark">
                    <div className="ptitle">System Administration</div>
                    <div className="psub">Full control over Doctor and Patient accounts (FR-7).</div>

                    {/* Metrics */}
                    <div className="metric-row">
                        <div className="metric" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('doctors')}>
                            <div className="metric-label">Total Doctors</div>
                            <div className="metric-val" style={{ color: 'var(--dk-accent)' }}>{doctors.length}</div>
                            <div className="metric-change">{pendingDoctors} pending approval</div>
                        </div>
                        <div className="metric" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('patients')}>
                            <div className="metric-label">Total Patients</div>
                            <div className="metric-val" style={{ color: 'var(--blue)' }}>{patients.length}</div>
                            <div className="metric-change">Active system users</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <button className={`btn ${activeTab === 'doctors' ? 'btn-dl' : 'btn-ghost'}`} onClick={() => setActiveTab('doctors')}>
                            <i className="ti ti-stethoscope"></i> Doctors
                        </button>
                        <button className={`btn ${activeTab === 'patients' ? 'btn-dl' : 'btn-ghost'}`} onClick={() => setActiveTab('patients')}>
                            <i className="ti ti-users"></i> Patients
                        </button>
                        <button className="btn btn-pri btn-sm" style={{ marginLeft: 'auto' }} onClick={() => openModal(`add-${activeTab.slice(0, -1)}`)}>
                            <i className="ti ti-plus"></i> Create {activeTab.slice(0, -1)}
                        </button>
                    </div>

                    {/* --- DOCTORS TABLE --- */}
                    {activeTab === 'doctors' && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="tw">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Specialisation</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {doctors.map(doc => (
                                            <tr key={doc._id}>
                                                <td style={{ color: 'var(--dk-text)', fontWeight: 600 }}>{doc.first_name} {doc.last_name}</td>
                                                <td>{doc.email}</td>
                                                <td>{doc.specialisation}</td>
                                                <td><span className={`badge ${doc.account_status === 'Active' ? 'b-low' : doc.account_status === 'Pending' ? 'b-mod' : doc.account_status === 'Suspended' || doc.account_status === 'Rejected' ? 'b-high' : 'b-crit'}`}>{doc.account_status}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--dk-accent)' }} onClick={() => openModal('status-doctor', doc)} title="Change Status"><i className="ti ti-arrows-exchange"></i></button>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--dk-text2)' }} onClick={() => openModal('edit-doctor', doc)} title="Edit Info"><i className="ti ti-pencil"></i></button>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => openModal('delete-doctor', doc)} title="Delete"><i className="ti ti-trash"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- PATIENTS TABLE --- */}
                    {activeTab === 'patients' && (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="tw">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Assigned Doctor</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map(pat => (
                                            <tr key={pat._id}>
                                                <td style={{ color: 'var(--dk-text)', fontWeight: 600 }}>{pat.first_name} {pat.last_name}</td>
                                                <td>{pat.email}</td>
                                                <td style={{ fontSize: '12px' }}>{pat.assigned_doctor ? '✅ Assigned' : '❌ Unassigned'}</td>
                                                <td><span className={`badge ${pat.status === 'Active' ? 'b-low' : pat.status === 'Suspended' ? 'b-high' : 'b-crit'}`}>{pat.status}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--dk-accent)' }} onClick={() => openModal('status-patient', pat)} title="Change Status"><i className="ti ti-arrows-exchange"></i></button>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--dk-text2)' }} onClick={() => openModal('edit-patient', pat)} title="Edit Info"><i className="ti ti-pencil"></i></button>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => openModal('delete-patient', pat)} title="Delete"><i className="ti ti-trash"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* --- GLOBAL MODAL SYSTEM --- */}
            <div className="modal-ov open" style={{ display: modalOpen ? 'flex' : 'none' }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="modal-box" style={{ background: 'var(--dk-bg3)', border: '1px solid var(--dk-border)' }}>

                    {/* MODAL: CHANGE STATUS */}
                    {modalType.includes('status') && selectedUser && (
                        <>
                            <div className="modal-hd">
                                <h3 style={{ color: 'var(--dk-text)' }}>Change Account Status</h3>
                                <button className="modal-x" style={{ background: 'var(--dk-bg2)', color: 'var(--dk-text2)' }} onClick={closeModal}><i className="ti ti-x"></i></button>
                            </div>
                            <div className="modal-bd">
                                <p style={{ color: 'var(--dk-text2)', marginBottom: '16px' }}>
                                    Update status for <strong style={{ color: 'var(--dk-text)' }}>{selectedUser.first_name} {selectedUser.last_name}</strong>
                                </p>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Select New Status</label>
                                    <select className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} defaultValue="" onChange={(e) => handleStatusChange(e.target.value)}>
                                        <option value="" disabled>Choose status...</option>
                                        {modalType.includes('doctor') ? (
                                            <>
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Active">Active</option>
                                                <option value="Suspended">Suspended</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="Deactivated">Deactivated</option>
                                                <option value="Removed">Removed</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Active">Active</option>
                                                <option value="Suspended">Suspended</option>
                                                <option value="Deactivated">Deactivated</option>
                                                <option value="Removed">Removed</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {/* MODAL: EDIT INFO */}
                    {modalType.includes('edit') && selectedUser && (
                        <form onSubmit={handleUpdateInfo}>
                            <div className="modal-hd">
                                <h3 style={{ color: 'var(--dk-text)' }}>Edit Information</h3>
                                <button type="button" className="modal-x" style={{ background: 'var(--dk-bg2)', color: 'var(--dk-text2)' }} onClick={closeModal}><i className="ti ti-x"></i></button>
                            </div>
                            <div className="modal-bd">
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>First Name</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                </div>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Middle Name</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} value={formData.mid_name} onChange={e => setFormData({ ...formData, mid_name: e.target.value })} />
                                </div>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Last Name</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                </div>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Email</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                {modalType.includes('doctor') && (
                                    <div className="fg">
                                        <label className="fl" style={{ color: 'var(--dk-text2)' }}>Specialisation</label>
                                        <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.specialisation} onChange={e => setFormData({ ...formData, specialisation: e.target.value })} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-ft">
                                <button type="button" className="btn btn-ghost" style={{ color: 'var(--dk-text2)' }} onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-pri">Save Changes</button>
                            </div>
                        </form>
                    )}

                    {/* MODAL: CREATE USER */}
                    {modalType.includes('add') && (
                        <form onSubmit={handleCreateUser}>
                            <div className="modal-hd">
                                <h3 style={{ color: 'var(--dk-text)' }}>Create New {modalType === 'add-doctor' ? 'Doctor' : 'Patient'}</h3>
                                <button type="button" className="modal-x" style={{ background: 'var(--dk-bg2)', color: 'var(--dk-text2)' }} onClick={closeModal}><i className="ti ti-x"></i></button>
                            </div>
                            <div className="modal-bd">
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>First Name</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                </div>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Last Name</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                </div>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Email</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="fg">
                                    <label className="fl" style={{ color: 'var(--dk-text2)' }}>Temporary Password</label>
                                    <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                {modalType === 'add-doctor' && (
                                    <div className="fg">
                                        <label className="fl" style={{ color: 'var(--dk-text2)' }}>Specialisation</label>
                                        <input className="fi" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required value={formData.specialisation} onChange={e => setFormData({ ...formData, specialisation: e.target.value })} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-ft">
                                <button type="button" className="btn btn-ghost" style={{ color: 'var(--dk-text2)' }} onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-pri">Create Account</button>
                            </div>
                        </form>
                    )}

                    {/* MODAL: DELETE CONFIRMATION */}
                    {modalType.includes('delete') && selectedUser && (
                        <>
                            <div className="modal-hd">
                                <h3 style={{ color: 'var(--red)' }}>⚠️ Permanent Deletion</h3>
                                <button className="modal-x" style={{ background: 'var(--dk-bg2)', color: 'var(--dk-text2)' }} onClick={closeModal}><i className="ti ti-x"></i></button>
                            </div>
                            <div className="modal-bd">
                                <p style={{ color: 'var(--dk-text)', marginBottom: '8px' }}>Are you absolutely sure you want to delete <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?</p>
                                <p style={{ color: 'var(--dk-text3)', fontSize: '13px' }}>This action cannot be undone. All associated data will be permanently removed from the system.</p>
                            </div>
                            <div className="modal-ft">
                                <button className="btn btn-ghost" style={{ color: 'var(--dk-text2)' }} onClick={closeModal}>Cancel</button>
                                <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={handleDelete}>Yes, Delete Permanently</button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}