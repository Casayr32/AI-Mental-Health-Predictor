/**
 * Chatbot Debug Page
 * Used to test Zhipu AI API connection and diagnose issues
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../App';

const API_KEY = '7b64dac891704a79863f2326a4abf7bb.6BBr5CYYgV0VTs8S';
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export default function ChatbotDebug() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [testMessage, setTestMessage] = useState('Hello, how are you?');
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        setTestResult(null);

        try {
            console.log('=== Testing Zhipu AI API Connection ===');
            console.log('API Key:', API_KEY.substring(0, 15) + '...');
            console.log('API URL:', API_URL);
            console.log('Test Message:', testMessage);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'glm-4.7-flash',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant.'
                        },
                        {
                            role: 'user',
                            content: testMessage
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 100
                })
            });

            console.log('Response Status:', response.status, response.statusText);
            console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('Response Body:', responseText);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}\n${responseText}`);
            }

            const data = JSON.parse(responseText);
            console.log('Parsed Response:', data);

            setTestResult({
                status: 'success',
                data: data,
                responseText: responseText
            });

            toast('API connection successful!', 'success');
        } catch (error) {
            console.error('Test Error:', error);
            setTestResult({
                status: 'error',
                error: error.message,
                details: error
            });
            toast('API connection failed!', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="screen active" id="scr-chatbot-debug">
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
                    <div className="sb-sec">Debug</div>
                    <div className="sb-item" onClick={() => { navigate('/patient/dashboard'); setSidebarOpen(false); }}><i className="ti ti-layout-dashboard"></i> Dashboard</div>
                    <div className="sb-item active" onClick={() => setSidebarOpen(false)}><i className="ti ti-message-circle"></i> Chatbot</div>
                    <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid var(--border)' }}>
                        <div className="sb-item" style={{ padding: '10px 0', borderLeft: 'none' }} onClick={() => { window.dispatchEvent(new Event('logout')); setSidebarOpen(false); }}>
                            <i className="ti ti-logout"></i> Logout
                        </div>
                    </div>
                </aside>

                <main className="main">
                    <div className="card">
                        <div className="ptitle">Chatbot API Debug</div>
                        <div className="psub">Test your Zhipu AI API connection</div>
                    </div>

                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="fl">Test Message:</label>
                            <input
                                className="fi"
                                type="text"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                placeholder="Enter a test message..."
                                style={{ width: '100%', marginTop: '8px' }}
                            />
                        </div>
                        <button
                            className="btn btn-pri"
                            onClick={testConnection}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? 'Testing...' : 'Test API Connection'}
                        </button>
                    </div>

                    {testResult && (
                        <div className="card" style={{ background: '#F5F5F5', fontFamily: 'monospace', fontSize: '12px' }}>
                            <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#333' }}>
                                {testResult.status === 'success' ? '✅ SUCCESS' : '❌ ERROR'}
                            </div>
                            {testResult.status === 'error' && (
                                <div style={{ color: '#D32F2F', marginBottom: '12px' }}>
                                    {testResult.error}
                                </div>
                            )}
                            <div style={{ marginBottom: '12px' }}>
                                <strong>Response Status:</strong> {testResult.status === 'success' ? '200 OK' : 'Failed'}
                            </div>
                            {testResult.status === 'success' && (
                                <div>
                                    <strong>Response:</strong>
                                    <pre style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginTop: '8px', maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd' }}>
                                        {JSON.stringify(testResult.data, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {testResult.status === 'error' && (
                                <div>
                                    <strong>Error Details:</strong>
                                    <pre style={{ background: '#fff', padding: '12px', borderRadius: '8px', marginTop: '8px', maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd', color: '#D32F2F' }}>
                                        {testResult.error}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="card" style={{ marginTop: '20px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <strong>API Configuration:</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            <div><strong>API URL:</strong> {API_URL}</div>
                            <div><strong>API Key:</strong> {API_KEY.substring(0, 15)}... (masked)</div>
                            <div><strong>Model:</strong> glm-4-flash</div>
                            <div><strong>Max Tokens:</strong> 100</div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '20px', background: '#FFF3E0', borderColor: '#FFB74D' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <strong>🔍 Troubleshooting:</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#E65100', lineHeight: '1.6' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>1. Check API Key:</strong><br />
                                - Go to Zhipu AI Dashboard (https://open.bigmodel.cn)<br />
                                - Verify your API key is valid and has credits<br />
                                - The API key format should be: id.secret
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>2. Check Network:</strong><br />
                                - Ensure you have internet connection<br />
                                - Try accessing https://open.bigmodel.cn in your browser
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>3. Check Quota:</strong><br />
                                - Your account might have run out of API credits<br />
                                - Visit Zhipu AI dashboard to add credits
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>4. Model Configuration:</strong><br />
                                - ✅ Model: glm-4.7-flash (Fast, efficient model)<br />
                                - API Base URL: https://open.bigmodel.cn/api/paas/v4<br />
                                - Endpoint: /chat/completions
                            </div>
                            <div>
                                <strong>5. API Key Format:</strong><br />
                                - Your API key should be in format: id.secret<br />
                                - Example: 7b64dac891704a79863f2326a4abf7bb.6BBr5CYYgV0VTs8S
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}