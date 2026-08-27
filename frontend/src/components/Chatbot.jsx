import { useState, useEffect, useRef, useCallback } from 'react';
import { chatbotService } from '../services/chatbotService';
import './Chatbot.css';

/**
 * MindCare AI Chatbot Component
 * Enhanced with retry visualization and offline fallback support
 */
export default function Chatbot({ onClose, patientName }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryStatus, setRetryStatus] = useState(null);
    const [lastFailedMessage, setLastFailedMessage] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const retryIntervalRef = useRef(null);

    // Initial greeting message
    useEffect(() => {
        const greeting = `Hello ${patientName || 'there'}! 👋\n\nI'm MindCare AI, here to support you on your mental health journey. I can help with:\n\n✨ Coping strategies for anxiety and stress\n🧠 Mindfulness and relaxation techniques\n💡 Wellness tips and healthy habits\n💬 A safe space to talk about your feelings\n\nHow are you feeling today?`;
        setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
    }, [patientName]);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, retryStatus, scrollToBottom]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
            }
        };
    }, []);

    // Poll retry status during loading
    const startRetryPolling = useCallback(() => {
        if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
        }

        retryIntervalRef.current = setInterval(() => {
            const status = chatbotService.getRetryStatus();
            setRetryStatus(status);
        }, 500);
    }, []);

    const stopRetryPolling = useCallback(() => {
        if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
        }
        setRetryStatus(null);
    }, []);

    // Handle message sending
    const handleSendMessage = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);
        setError(null);
        setLastFailedMessage(null);
        startRetryPolling();

        // Add user message to chat
        const userMsg = {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            // Check for emergency (no API call needed)
            if (chatbotService.isEmergencyRequest(userMessage)) {
                stopRetryPolling();
                const emergencyResponse = chatbotService.getEmergencyResponse
                    ? chatbotService.getEmergencyResponse()
                    : `⚠️ **IF YOU ARE IN AN IMMEDIATE CRISIS OR EMERGENCY:**
📞 Please contact your local emergency services immediately.
🆘 Find international crisis support: https://findahelpline.com/`;
                setMessages(prev => [...prev, { role: 'assistant', content: emergencyResponse, timestamp: new Date(), isEmergency: true }]);
                return;
            }

            // Send to AI service
            const response = await chatbotService.sendMessage(userMessage);

            stopRetryPolling();

            if (response.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.message,
                    timestamp: new Date(),
                    isOfflineFallback: response.isOfflineFallback
                }]);

                if (response.isOfflineFallback) {
                    setError('Running in offline mode - responses may be limited');
                }
            } else {
                // Service returned fallback message
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.fallbackMessage,
                    timestamp: new Date(),
                    isOfflineFallback: true
                }]);
                setError('Connection issue - showing offline response');
                setLastFailedMessage(userMessage);
            }

        } catch (err) {
            stopRetryPolling();
            console.error('Send message error:', err);

            const fallbackContent = 'I\'m having trouble connecting right now. Here are some general tips:\n\n🧘 Take deep breaths - inhale 4 sec, hold 4 sec, exhale 4 sec\n💚 Remember: difficult moments are temporary\n📞 If you need immediate help, contact a crisis line\n\nPlease try again in a moment.';

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: fallbackContent,
                timestamp: new Date(),
                isOfflineFallback: true
            }]);
            setError('Unable to connect. Please check your internet and try again.');
            setLastFailedMessage(userMessage);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    // Retry failed message
    const handleRetry = async (e) => {
        e.stopPropagation();
        if (!lastFailedMessage || isLoading) return;

        // Remove the last fallback message
        setMessages(prev => prev.slice(0, -1));
        setError(null);
        setLastFailedMessage(null);

        // Resend
        setInput(lastFailedMessage);
        // Small delay to ensure state updates
        setTimeout(() => {
            handleSendMessage({ preventDefault: () => { }, stopPropagation: () => { } });
        }, 100);
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        e.stopPropagation();
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
            setError(null);
            setLastFailedMessage(null);
            const greeting = `Hello ${patientName || 'there'}! 👋\n\nI'm MindCare AI, here to support you on your mental health journey. How are you feeling today?`;
            setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
        }
    };

    // Prevent click propagation
    const handleContainerClick = (e) => {
        e.stopPropagation();
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                            <span className={`status-dot ${retryStatus?.isRetrying ? 'retrying' : ''}`}></span>
                            <span className="status-text">
                                {retryStatus?.isRetrying
                                    ? `Connecting... (attempt ${retryStatus.retryCount + 1}/${retryStatus.maxRetries})`
                                    : 'Always here for you'
                                }
                            </span>
                        </div>
                    </div>
                </div>
                <div className="chatbot-header-actions">
                    <button
                        className="icon-btn"
                        onClick={handleClearChat}
                        title="Clear conversation"
                        disabled={isLoading}
                    >
                        <i className="ti ti-trash"></i>
                    </button>
                    <button
                        className="icon-btn close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            stopRetryPolling();
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
                                        {msg.isOfflineFallback && (
                                            <div className="offline-badge">
                                                <i className="ti ti-wifi-off"></i>
                                                <span>Offline Response</span>
                                            </div>
                                        )}
                                        <div className="message-text">{msg.content}</div>
                                        <div className="message-actions">
                                            <button
                                                className="action-btn"
                                                title="Copy"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard?.writeText(msg.content);
                                                }}
                                            >
                                                <i className="ti ti-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="message-meta">
                                <span className="message-time">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Emergency Alert */}
                {messages.some(msg => msg.content?.includes('⚠️') && msg.content?.includes('EMERGENCY')) && (
                    <div className="emergency-alert">
                        <i className="ti ti-alert-circle"></i>
                        <span>Emergency resources are always available 24/7</span>
                    </div>
                )}

                {/* Typing/Loading Indicator */}
                {isLoading && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                        <span>
                            {retryStatus?.isRetrying
                                ? `Trying to connect (attempt ${retryStatus.retryCount + 1})...`
                                : 'MindCare AI is thinking...'
                            }
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Error/Status Message */}
            {error && (
                <div className="error-message">
                    <i className="ti ti-alert-triangle"></i>
                    <span>{error}</span>
                    {lastFailedMessage && (
                        <button
                            className="retry-btn"
                            onClick={handleRetry}
                            title="Retry last message"
                        >
                            <i className="ti ti-refresh"></i>
                            Retry
                        </button>
                    )}
                    <button onClick={(e) => {
                        e.stopPropagation();
                        setError(null);
                    }}>
                        <i className="ti ti-x"></i>
                    </button>
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
