import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getChatHistory, sendDoctorMessage } from '../services/api';

export default function DoctorPatientMessages() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [patient, setPatient] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const chatEndRef = useRef(null);

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    })();

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getChatHistory(patientId);

                if (res?.data && res.data.messages) {
                    setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
                    if (res.data.patient) {
                        setPatient(res.data.patient);
                    }
                } else if (Array.isArray(res?.data)) {
                    setMessages(res.data);
                } else {
                    setMessages([]);
                }
            } catch (err) {
                console.error('Error fetching doctor messages:', err);
                setError(err.response?.data?.message || 'Failed to load messages.');
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [patientId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            const res = await sendDoctorMessage({
                patient_id: patientId,
                message_text: newMessage
            });

            const sentMsgObj = {
                _id: res?.data?._id || `temp-${Date.now()}`,
                message_text: newMessage,
                sender_role: 'doctor',
                sender_id: user._id || user.id || user.user_id,
                sent_at: new Date().toISOString()
            };

            setMessages((prev) => [...(Array.isArray(prev) ? prev : []), sentMsgObj]);
            setNewMessage('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const patientInfo = patient || {
        first_name: 'Unknown',
        last_name: 'Patient',
        email: 'Unknown'
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
                    <div className="sb-item" onClick={() => { navigate('/doctor/dashboard'); setSidebarOpen(false); }}>
                        <i className="ti ti-layout-dashboard"></i> Dashboard
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/doctor/alerts'); setSidebarOpen(false); }}>
                        <i className="ti ti-alert-triangle"></i> Alerts
                    </div>
                    <div className="sb-item active" onClick={() => { navigate('/doctor/messages'); setSidebarOpen(false); }}>
                        <i className="ti ti-message"></i> Messages
                    </div>
                    <div className="sb-item" onClick={() => { navigate('/doctor-reports'); setSidebarOpen(false); }}>
                        <i className="ti ti-file-text"></i> Reports
                    </div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--dk-border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main main-dark">
                    <div className="msg-layout">
                        <div className="msg-list">
                            <div style={{ padding: '14px', borderBottom: '1px solid var(--dk-border)', fontSize: '13px', fontWeight: '700', color: 'var(--dk-text)' }}>Messages</div>
                            <div className="msg-contact active">
                                <div className="av av-pri" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--dk-accent)' }}>
                                    {patientInfo.first_name?.charAt(0) || ''}{patientInfo.last_name?.charAt(0) || ''}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--dk-text)' }}>{patientInfo.first_name} {patientInfo.last_name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--dk-text3)' }}>{patientInfo.email}</div>
                                </div>
                            </div>
                        </div>

                        <div className="msg-chat">
                            <div className="chat-top">
                                <div className="av av-pri" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--dk-accent)' }}>
                                    {patientInfo.first_name?.charAt(0) || ''}{patientInfo.last_name?.charAt(0) || ''}
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--dk-text)' }}>{patientInfo.first_name} {patientInfo.last_name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--dk-text3)' }}>{patientInfo.email}</div>
                                </div>
                            </div>

                            <div className="chat-msgs" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', color: 'var(--dk-text3)', padding: '40px' }}>Loading...</div>
                                ) : error ? (
                                    <div style={{ textAlign: 'center', color: '#d9534f', padding: '40px' }}>{error}</div>
                                ) : Array.isArray(messages) && messages.length > 0 ? (
                                    messages.map((msg, idx) => {
                                        if (!msg) return null;

                                        // 1. Hubi role-ka ka soo laabtay backend-ka
                                        const rawRole = (
                                            msg.sender_role ||
                                            msg.sender_type ||
                                            msg.sender?.role ||
                                            msg.sender ||
                                            ''
                                        ).toString().toLowerCase();

                                        // 2. Hubi sender_id ka soo laabtay backend-ka
                                        const msgSenderId = (
                                            msg.sender_id?._id ||
                                            msg.sender_id ||
                                            msg.sender?._id ||
                                            ''
                                        ).toString();

                                        const isPatient =
                                            rawRole.includes('patient') ||
                                            rawRole === 'user' ||
                                            (msgSenderId === patientId.toString());

                                        return (
                                            <div
                                                key={msg._id || idx}
                                                style={{
                                                    alignSelf: isPatient ? 'flex-end' : 'flex-start',
                                                    backgroundColor: isPatient ? '#10b981' : '#0f766e', // Patient Green Right, Doctor Dark Teal Left
                                                    color: '#ffffff',
                                                    padding: '10px 14px',
                                                    borderRadius: isPatient ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                    maxWidth: '75%',
                                                    wordBreak: 'break-word',
                                                    fontSize: '14px',
                                                    lineHeight: '1.5',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px', fontWeight: 'bold' }}>
                                                    {isPatient ? 'Patient' : 'You'}
                                                </div>

                                                <div>{msg.message_text}</div>

                                                {msg.sent_at && (
                                                    <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                                                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--dk-text3)', padding: '40px' }}>No messages yet.</div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form className="chat-input-wrap" onSubmit={handleSendMessage}>
                                <input
                                    className="fi"
                                    type="text"
                                    placeholder="Type your message here..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <button type="submit" className="btn btn-pri" disabled={sending || !newMessage.trim()}>
                                    <i className="ti ti-send"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}