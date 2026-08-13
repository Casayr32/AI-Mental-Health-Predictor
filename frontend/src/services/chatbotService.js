/**
 * MindCare AI Chatbot Service
 * Optimized for English & Somali conversations with Gemini API.
 */

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const MODEL_NAME = 'gemini-flash-latest';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// Adaptive System Prompt for Somali & English support
const CLINICAL_SYSTEM_PROMPT = `You are MindCare AI, an empathetic mental health support assistant.

**Core Rules:**
- Provide compassionate, clear, and direct mental health support.
- **Language Adaptation:** Always respond strictly in the EXACT same language the user uses.
  - If the user writes in Somali, reply ONLY in natural, friendly Somali.
  - If the user writes in English, reply ONLY in natural English.
- Keep your answers concise, empathetic, and complete. Avoid extremely long introductions so the answer is never cut off.`;

const EMERGENCY_RESOURCES_SOMALI = `⚠️ **HADDII AAD KU JIRTO XAALAD DEGDEG AH AMBA HALIS:**
📞 Fadlan la xiriir adeegga caafimaadka degdegga ah ee kuugu dhow.
🆘 Caawimaad Caalami ah: https://findahelpline.com/

Walaal, ma xuma in aad caawimaad raadsato. Fadlan la xiriir dadka kuu dhow ama adeegyada caafimaadka degdegga ah.`;

const EMERGENCY_RESOURCES_ENGLISH = `⚠️ **IF YOU ARE IN AN IMMEDIATE CRISIS OR EMERGENCY:**
📞 Please contact your local emergency services immediately.
🆘 Find international crisis support: https://findahelpline.com/

You are not alone, and help is available. Please reach out to someone you trust or a professional nearby.`;

class ChatbotService {
    constructor() {
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
    }

    async sendMessage(userMessage) {
        try {
            if (!userMessage || userMessage.trim() === '') {
                throw new Error('Message cannot be empty.');
            }

            const isEnglish = this.detectIsEnglish(userMessage);

            // Check for emergency / self-harm intent
            if (this.isEmergencyRequest(userMessage)) {
                return {
                    success: true,
                    message: isEnglish ? EMERGENCY_RESOURCES_ENGLISH : EMERGENCY_RESOURCES_SOMALI,
                    timestamp: new Date().toISOString(),
                    isEmergency: true
                };
            }

            // Append current user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            // Maintain context window strictly by pair counts
            if (this.conversationHistory.length > this.maxHistoryLength) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
                if (this.conversationHistory[0].role === 'model') {
                    this.conversationHistory.shift();
                }
            }

            // Prepare API Request payload
            const requestBody = {
                systemInstruction: {
                    parts: [{ text: CLINICAL_SYSTEM_PROMPT }]
                },
                contents: this.conversationHistory,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048 // 👈 WAA LA KORDHIYAY SI AANAY JAWAABTU U GO'IN
                }
            };

            // Call Gemini API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) { }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Extract response text safely
            const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                (isEnglish
                    ? "Hello! I am here to support you. How are you feeling today?"
                    : "Asc! Sideed tahay maanta? Waxaan halkan u joogaa inaan ku caawiyo.");

            // Append AI response to conversation history
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: aiMessage }]
            });

            return {
                success: true,
                message: aiMessage,
                timestamp: new Date().toISOString(),
                conversationId: this.generateConversationId(),
                model: MODEL_NAME
            };

        } catch (error) {
            console.error('Chatbot API Error:', error);

            if (this.conversationHistory.length > 0 &&
                this.conversationHistory[this.conversationHistory.length - 1].role === 'user') {
                this.conversationHistory.pop();
            }

            let userFriendlyError = error.message;

            if (error.message.includes('Failed to fetch')) {
                userFriendlyError = 'Khadka internet-ka ayaa xumaaday / Internet connection failed.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                userFriendlyError = 'API Key-ga waa lagu diiday / Invalid API Key.';
            } else if (error.message.includes('429')) {
                userFriendlyError = 'Codsiyada ayaa aad u batay / Rate limit exceeded.';
            }

            return {
                success: false,
                error: userFriendlyError,
                fallbackMessage: 'Waan ka xunahay, waxaa dhacay cilad. Fadlan mar kale isku day.',
                timestamp: new Date().toISOString()
            };
        }
    }

    isEmergencyRequest(message) {
        const emergencyKeywords = [
            'suicide', 'kill myself', 'want to die', 'end my life',
            'self-harm', 'hurt myself', 'emergency', 'crisis',
            'nafta jarayaa', 'is dilayaa', 'nolol ma rabo', 'is qarxin', 'dhimasho rabaa'
        ];
        const lowerMessage = message.toLowerCase();
        return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    detectIsEnglish(message) {
        const englishWords = ['the', 'and', 'is', 'you', 'are', 'help', 'feel', 'sad', 'anxious', 'depressed', 'i', 'my', 'how'];
        const words = message.toLowerCase().split(/\s+/);
        const englishCount = words.filter(word => englishWords.includes(word)).length;
        return englishCount > 1;
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    generateConversationId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
}

export const chatbotService = new ChatbotService();
export default ChatbotService;