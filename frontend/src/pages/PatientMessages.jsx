import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientMessages, sendPatientMessage } from '../services/api';

export default function PatientMessages() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [assignedDoctor, setAssignedDoctor] = useState(null);
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

    const currentUserId = user?._id || user?.id || user?.user_id;

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await getPatientMessages();

                if (res?.data && res.data.messages) {
                    setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
                    if (res.data.assigned_doctor) {
                        setAssignedDoctor(res.data.assigned_doctor);
                    }
                } else if (Array.isArray(res?.data)) {
                    setMessages(res.data);
                } else {
                    setMessages([]);
                }
            } catch (err) {
                console.error('Error fetching patient messages:', err);
                setError(err.response?.data?.message || 'Failed to load messages.');
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            const res = await sendPatientMessage({ message_text: newMessage });

            const sentMsgObj = {
                _id: res?.data?._id || `temp-${Date.now()}`,
                message_text: newMessage,
                sender_role: 'patient',
                sender_id: currentUserId,
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

    const docInfo = (() => {
        const doc = assignedDoctor || user.assigned_doctor;
        if (!doc) return { name: 'No Doctor Assigned', spec: 'Please assign a doctor' };
        if (typeof doc === 'string') return { name: 'My Assigned Doctor', spec: 'Encrypted Channel' };
        const fullName = `${doc.first_name || ''} ${doc.last_name || ''}`.trim();
        return {
            name: fullName ? `Dr. ${fullName}` : 'My Clinician',
            spec: doc.specialisation || doc.specialty || 'Encrypted Channel'
        };
    })();

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
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sb-logo">MindCare AI<span>MENTAL HEALTHCARE</span></div>
                    <div className="sb-sec">Main</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/assess'); setSidebarOpen(false); }}><i className="ti ti-clipboard-check"></i> New Assessment</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/history'); setSidebarOpen(false); }}><i className="ti ti-history"></i> History</div>
                    <div className="sb-item active" onClick={() => { navigate('/patient/messages'); setSidebarOpen(false); }}><i className="ti ti-message"></i> Messages</div>
                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}><i className="ti ti-logout"></i> Logout</div>
                    </div>
                </aside>

                <main className="main">
                    <div className="msg-layout">
                        <div className="msg-list">
                            <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: '700', color: 'var(--text2)' }}>Messages</div>
                            <div className="msg-contact active">
                                <div className="av av-pri">DR</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{docInfo.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{docInfo.spec}</div>
                                </div>
                            </div>
                        </div>

                        <div className="msg-chat">
                            <div className="chat-top">
                                <div className="av av-pri">DR</div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{docInfo.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{docInfo.spec}</div>
                                </div>
                            </div>

                            <div className="chat-msgs" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px' }}>Loading...</div>
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
                                            (currentUserId && msgSenderId === currentUserId.toString());

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
                                                    {isPatient ? 'You' : docInfo.name}
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
                                    <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px' }}>No messages yet.</div>
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