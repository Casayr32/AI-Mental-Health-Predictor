import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPatients, getChatHistory, sendDoctorMessage } from '../services/api';
import { toast } from '../App';

export default function DoctorMessages() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const chatEndRef = useRef(null);

    // Get current logged-in Doctor ID
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    })();

    const currentDoctorId = user?._id || user?.id || user?.user_id;

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchPatients = async () => {
        try {
            const res = await getDoctorPatients();
            const patientList = Array.isArray(res?.data) ? res.data : [];
            setPatients(patientList);
            if (patientList.length > 0) {
                handleSelectPatient(patientList[0]);
            }
        } catch (error) {
            console.error('Failed to load patients:', error);
            setPatients([]);
            if (typeof toast === 'function') toast('Failed to load patient list', 'error');
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectPatient = async (pat) => {
        if (!pat?._id) return;
        setSelectedPatient(pat);
        try {
            const res = await getChatHistory(pat._id);
            setMessages(Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.messages) ? res.data.messages : []);
        } catch (error) {
            console.error('Failed to load chat history:', error);
            setMessages([]);
            if (typeof toast === 'function') toast('Failed to load messages', 'error');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !selectedPatient?._id) return;

        try {
            const res = await sendDoctorMessage({ patient_id: selectedPatient._id, message_text: text });

            const sentMsgObj = {
                _id: res?.data?._id || `temp-${Date.now()}`,
                message_text: text,
                sender_role: 'doctor',
                sender_id: currentDoctorId,
                sent_at: new Date().toISOString()
            };

            setMessages((prev) => [...(Array.isArray(prev) ? prev : []), sentMsgObj]);
            setText('');
        } catch (error) {
            if (typeof toast === 'function') toast(error.response?.data?.message || 'Failed to send', 'error');
        }
    };

    const getInitials = (patient) => {
        const first = patient?.first_name ? patient.first_name[0] : 'P';
        const last = patient?.last_name ? patient.last_name[0] : '';
        return (first + last).toUpperCase();
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
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/alerts'); setSidebarOpen(false); }}><i className="ti ti-alert-triangle"></i> Alerts</div>
                    <div className="sb-item active"><i className="ti ti-message"></i> Messages</div>
                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}><i className="ti ti-logout"></i> Logout</div>
                    </div>
                </aside>

                <main className="main main-dark" style={{ padding: '16px' }}>
                    <div className="msg-layout" style={{ background: 'var(--dk-bg3)', borderColor: 'var(--dk-border)' }}>
                        <div className="msg-list" style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                            <div style={{ padding: '14px', borderBottom: '1px solid var(--dk-border)', fontSize: '13px', fontWeight: '700', color: 'var(--dk-text2)' }}>My Patients</div>
                            <div style={{ padding: '10px', borderBottom: '1px solid var(--dk-border)' }}>
                                <div className="search-wrap" style={{ maxWidth: '100%' }}>
                                    <i className="ti ti-search"></i>
                                    <input
                                        className="fi"
                                        type="text"
                                        placeholder="Search patients..."
                                        style={{ background: 'var(--dk-bg)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)', width: '100%' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {Array.isArray(filteredPatients) && filteredPatients.length > 0 ? (
                                filteredPatients.map(pat => (
                                    <div key={pat._id || pat.id} className={`msg-contact ${selectedPatient?._id === pat._id ? 'active' : ''}`} onClick={() => handleSelectPatient(pat)} style={{ borderColor: 'var(--dk-border)' }}>
                                        <div className="av av-pri" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--dk-accent)' }}>
                                            {getInitials(pat)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>{pat.first_name || 'Patient'} {pat.last_name || ''}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--dk-text3)' }}>Encrypted Channel</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--dk-text3)', fontSize: '13px' }}>
                                    {searchTerm ? 'No patients found matching your search.' : 'No patients available.'}
                                </div>
                            )}
                        </div>

                        <div className="msg-chat" style={{ background: 'var(--dk-bg)' }}>
                            {selectedPatient ? (
                                <>
                                    <div className="chat-top" style={{ borderColor: 'var(--dk-border)', background: 'var(--dk-bg3)' }}>
                                        <div className="av av-pri" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--dk-accent)' }}>
                                            {getInitials(selectedPatient)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--dk-text)' }}>{selectedPatient.first_name || 'Patient'} {selectedPatient.last_name || ''}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--dk-accent)' }}><i className="ti ti-lock" style={{ fontSize: '10px' }}></i> End-to-End Encrypted</div>
                                        </div>
                                    </div>

                                    <div className="chat-msgs" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--dk-bg)' }}>
                                        {Array.isArray(messages) && messages.length > 0 ? messages.map((msg, index) => {
                                            if (!msg) return null;

                                            // 1. Dynamic Role Check
                                            const rawRole = (
                                                msg.sender_role ||
                                                msg.sender_type ||
                                                msg.sender?.role ||
                                                msg.sender ||
                                                ''
                                            ).toString().toLowerCase();

                                            // 2. Sender ID check against Doctor ID
                                            const msgSenderId = (
                                                msg.sender_id?._id ||
                                                msg.sender_id ||
                                                msg.sender?._id ||
                                                ''
                                            ).toString();

                                            const isDoctor =
                                                rawRole.includes('doctor') ||
                                                rawRole === 'clinician' ||
                                                (currentDoctorId && msgSenderId === currentDoctorId.toString());

                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    style={{
                                                        alignSelf: isDoctor ? 'flex-end' : 'flex-start',
                                                        backgroundColor: isDoctor ? '#10b981' : '#374151',
                                                        color: '#ffffff',
                                                        padding: '10px 14px',
                                                        borderRadius: isDoctor ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                        maxWidth: '75%',
                                                        wordBreak: 'break-word',
                                                        fontSize: '14px',
                                                        lineHeight: '1.5',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', fontWeight: 'bold' }}>
                                                        {isDoctor ? 'You (Doctor)' : `${selectedPatient.first_name || 'Patient'}`}
                                                    </div>

                                                    <div>{msg.message_text}</div>

                                                    <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '6px', textAlign: 'right' }}>
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div style={{ textAlign: 'center', color: 'var(--dk-text3)', padding: '40px', fontSize: '13px' }}>
                                                <i className="ti ti-lock" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
                                                No messages yet. Send a secure clinical message below.
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <form className="chat-input-wrap" style={{ borderColor: 'var(--dk-border)', background: 'var(--dk-bg3)' }} onSubmit={handleSend}>
                                        <input className="fi" type="text" placeholder="Type a secure message..." value={text} onChange={e => setText(e.target.value)} style={{ background: 'var(--dk-bg2)', borderColor: 'var(--dk-border)', color: 'var(--dk-text)' }} required />
                                        <button type="submit" className="btn btn-pri"><i className="ti ti-send"></i></button>
                                    </form>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dk-text3)' }}>Select a patient to start messaging</div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}