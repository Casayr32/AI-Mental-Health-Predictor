import { useState, useEffect, useRef, useCallback } from 'react';
import { chatbotService } from '../services/chatbotService';
import './Chatbot.css';

/**
 * MindCare AI Chatbot Component
 * Beautiful, clinically-safe mental health support chatbot
 */
export default function Chatbot({ onClose, patientName }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Initial greeting message
    useEffect(() => {
        const greeting = `Hello ${patientName || 'there'}! 👋\n\nI'm MindCare AI, here to support you on your mental health journey. I can help with:\n\n✨ Coping strategies for anxiety and stress\n🧠 Mindfulness and relaxation techniques\n💡 Wellness tips and healthy habits\n💬 A safe space to talk about your feelings\n\nHow are you feeling today?`;
        setMessages([{ role: 'assistant', content: greeting }]);
    }, [patientName]);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle message sending
    const handleSendMessage = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stop event propagation

        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);
        setError(null);

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            // Check for emergency
            if (chatbotService.isEmergencyRequest(userMessage)) {
                const emergencyResponse = chatbotService.getEmergencyResponse();
                setMessages(prev => [...prev, { role: 'assistant', content: emergencyResponse }]);
                return;
            }

            // Send to AI
            const response = await chatbotService.sendMessage(userMessage);

            if (response.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
            } else {
                setError(response.fallbackMessage);
                setMessages(prev => [...prev, { role: 'assistant', content: response.fallbackMessage }]);
            }

        } catch (err) {
            setError('Sorry, I\'m having trouble connecting. Please try again.');
            setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m having trouble connecting right now. Please try again in a moment.' }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    // Handle Enter key (send with Shift+Enter for new line)
    const handleKeyDown = (e) => {
        e.stopPropagation(); // Prevent modal key listeners from catching this
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // Clear conversation
    const handleClearChat = (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to clear this conversation?')) {
            chatbotService.clearHistory();
            setMessages([]);
            const greeting = `Hello ${patientName || 'there'}! 👋\n\nI'm MindCare AI, here to support you on your mental health journey.`;
            setMessages([{ role: 'assistant', content: greeting }]);
        }
    };

    // Prevent modal click propagation when clicking anywhere inside chatbot
    const handleContainerClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="chatbot-container" onClick={handleContainerClick}>
            {/* Header */}
            <div className="chatbot-header">
                <div className="chatbot-header-content">
                    <div className="chatbot-avatar">
                        <div className="avatar-inner">
                            <i className="ti ti-robot"></i>
                        </div>
                    </div>
                    <div className="chatbot-info">
                        <h3>MindCare AI</h3>
                        <div className="status-indicator">
                            <span className="status-dot"></span>
                            <span className="status-text">Always here for you</span>
                        </div>
                    </div>
                </div>
                <div className="chatbot-header-actions">
                    <button
                        className="icon-btn"
                        onClick={handleClearChat}
                        title="Clear conversation"
                    >
                        <i className="ti ti-trash"></i>
                    </button>
                    <button
                        className="icon-btn close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        title="Close chat"
                    >
                        <i className="ti ti-x"></i>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="chatbot-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                        <div className={`message ${msg.role}`}>
                            <div className="message-content">
                                {msg.role === 'user' ? (
                                    <p>{msg.content}</p>
                                ) : (
                                    <div className="ai-message-content">
                                        <div className="message-text">{msg.content}</div>
                                        <div className="message-actions">
                                            <button className="action-btn" title="Copy" onClick={(e) => e.stopPropagation()}>
                                                <i className="ti ti-copy"></i>
                                            </button>
                                            <button className="action-btn" title="Regenerate" onClick={(e) => e.stopPropagation()}>
                                                <i className="ti ti-refresh"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="message-meta">
                                <span className="message-time">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Emergency Alert */}
                {messages.some(msg => msg.content.includes('⚠️ IF YOU OR SOMEONE ELSE')) && (
                    <div className="emergency-alert">
                        <i className="ti ti-alert-circle"></i>
                        <span>Emergency resources are always available</span>
                    </div>
                )}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                        <span>MindCare AI is thinking...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <i className="ti ti-alert-triangle"></i>
                    <span>{error}</span>
                    <button onClick={(e) => { e.stopPropagation(); setError(null); }}><i className="ti ti-x"></i></button>
                </div>
            )}

            {/* Input Area */}
            <form className="chatbot-input" onSubmit={handleSendMessage} onClick={(e) => e.stopPropagation()}>
                <div className="input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Type your message here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isLoading}
                        rows={1}
                        maxLength={500}
                    />
                    <div className="input-footer">
                        <span className="char-count">{input.length}/500</span>
                        <button
                            type="submit"
                            className="send-btn"
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? (
                                <i className="ti ti-loader animate-spin"></i>
                            ) : (
                                <i className="ti ti-send"></i>
                            )}
                        </button>
                    </div>
                </div>
                <div className="input-hint">
                    <i className="ti ti-info-circle"></i>
                    <span>Your conversations are confidential and secure</span>
                </div>
            </form>
        </div>
    );
}