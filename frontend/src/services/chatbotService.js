/**
 * MindCare AI Chatbot Service
 * Auto-discovers available Gemini models - never breaks due to model deprecation
 */

const API_KEY = 'AQ.Ab8RN6L06NjPsBuBZ3xvbNIWqYxzEDtMl5nOh5CsK7iPVA3t6g';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    retryableErrors: [503, 429, 500, 502, 504]
};

const CLINICAL_SYSTEM_PROMPT = `You are MindCare AI, an empathetic mental health support assistant.

**Core Rules:**
- Provide compassionate, clear, and direct mental health support.
- **Language Adaptation:** Always respond strictly in the EXACT same language the user uses.
  - If the user writes in Somali, reply ONLY in natural, friendly Somali.
  - If the user writes in English, reply ONLY in natural English.
- Keep your answers concise, empathetic, and complete. Avoid extremely long responses.`;

const EMERGENCY_RESOURCES_SOMALI = `⚠️ **HADDII AAD KU JIRTO XAALAD DEGDEG AH AMBA HALIS:**
📞 Fadlan la xiriir adeegga caafimaadka degdegga ah ee kuugu dhow.
🆘 Caawimaad Caalami ah: https://findahelpline.com/
Walaal, ma xuma in aad caawimaad raadsato. Fadlan la xiriir dadka kuu dhow.`;

const EMERGENCY_RESOURCES_ENGLISH = `⚠️ **IF YOU ARE IN AN IMMEDIATE CRISIS OR EMERGENCY:**
📞 Please contact your local emergency services immediately.
🆘 Find international crisis support: https://findahelpline.com/
You are not alone, and help is available. Please reach out to someone you trust.`;

// Offline fallback responses
const OFFLINE_RESPONSES = {
    english: {
        anxiety: [
            "I understand anxiety can feel overwhelming. Here are some quick techniques:\n\n🧘 **4-7-8 Breathing:** Inhale 4 sec, hold 7 sec, exhale 8 sec\n🌿 **Grounding:** Name 5 things you see, 4 you touch, 3 you hear\n💧 **Cold water:** Splash cold water on your face\n\nThese can help calm your nervous system."
        ],
        stress: [
            "Stress affects us all differently. Try these strategies:\n\n✅ **Prioritize tasks** - tackle one thing at a time\n✅ **Take breaks** - even 5 minutes helps\n✅ **Move your body** - a short walk can reset your mind\n✅ **Talk to someone** - sharing lightens the load"
        ],
        sad: [
            "I'm sorry you're feeling this way. It's okay to not be okay:\n\n💛 **Be kind to yourself** - don't judge your feelings\n💛 **Reach out** - connect with someone you trust\n💛 **Small steps** - focus on basic self-care first\n💛 **Professional help** - a therapist can provide great support"
        ],
        sleep: [
            "Sleep difficulties are common and treatable:\n\n🌙 **Consistent schedule** - same bedtime every day\n📱 **Screen-free zone** - no devices 30 min before bed\n🫖 **Relaxing routine** - warm tea, reading, gentle stretching\n🌡️ **Cool room** - around 65-68°F is ideal"
        ],
        general: [
            "I'm here to listen and support you.\n\n💬 Your feelings are valid\n💪 You have the strength to get through this\n🤝 You don't have to face this alone\n\nCould you tell me more about what's on your mind?",
            "Thank you for reaching out. Taking care of your mental health is important.\n\nWhat would be most helpful - coping strategies, someone to listen, or wellness tips?"
        ]
    },
    somali: {
        anxiety: [
            "Waan fahmay in cabsida ay ku adag tahay:\n\n🧘 **Neef-saar 4-7-8:** Neefsado 4 ilbiriq, qabo 7, saaro 8\n🌿 **Dhigasho:** Magaca 5 wax oo arki, 4 oo taabo, 3 oo maqlo\n💧 **Biyaa qabow:** Kala dir biyo qabow oo wajigaaga"
        ],
        stress: [
            "Waa caadi in stras-ku saameeyo:\n\n✅ **Ugu horreeyow waxka ugu muhiimsan**\n✅ **Is dhaaf** - 5 daqiiqo waa kuu filan\n✅ **Dhaqso** - socdaal gaaban mind-kaaga wuu cusbooneysiiyaa\n✅ **La hadal qof** - wadaagista waa sunta shaqeyneysa"
        ],
        sad: [
            "Waan ka xunahay inaad sidaas u qabato:\n\n💛 **Naxariis naftaada** - ha xukumin feelings-kaaga\n💛 **La xiriir** - qof aad kala yaabi karto\n💛 **Tallaabo yaryar** - ilbaxsiinta ka hortag\n💛 **Caawimaad xirfadeed** - dhakhtar psikoloji waa caawi"
        ],
        sleep: [
            "Dhibaatooyinka hurda waa caadi oo la daaweyn karo:\n\n🌙 **Waqti isdhaafsar** - hora waa isdhaafsaraa\n📱 **Biraawsar la'aan** - telefoon 30 daqiiqo ka hor\n🫖 **Falanqeyn dheelitir** - shah daqiiqdi ah, akhris"
        ],
        general: [
            "Waan halkan u joogaa inaan ku maqlo oo ku caawiyo:\n\n💬 Feelings-kaaga waa sax\n💪 Aad waxaad leedahay xoogga inaad isbadasho\n🤝 Haan waalid inaad adkaysato",
            "Waad ku mahadsantahay inaad la xiriirto. Feelings-kaaga waa muhiim."
        ]
    }
};

class ChatbotService {
    constructor() {
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
        this.availableModels = [];
        this.modelsLoaded = false;
        this.isRetrying = false;
        this.retryCount = 0;
        this.lastSuccessfulModel = null;
        this.modelFetchPromise = null;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    getRetryDelay(attempt) {
        const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        return Math.min(delay + jitter, RETRY_CONFIG.maxDelay);
    }

    /**
     * Discover available models from the API
     */
    async discoverModels() {
        // Return cached models if already loaded
        if (this.modelsLoaded && this.availableModels.length > 0) {
            return this.availableModels;
        }

        // If already fetching, wait for that to complete
        if (this.modelFetchPromise) {
            return this.modelFetchPromise;
        }

        this.modelFetchPromise = this._fetchModels();
        try {
            const models = await this.modelFetchPromise;
            return models;
        } finally {
            this.modelFetchPromise = null;
        }
    }

    async _fetchModels() {
        console.log('🔍 Discovering available Gemini models...');

        try {
            const response = await fetch(`${API_BASE}/models?key=${API_KEY}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                console.warn('Failed to fetch models list, using fallback');
                return this.getFallbackModels();
            }

            const data = await response.json();

            // Filter models that support generateContent
            const validModels = data.models
                ?.filter(model =>
                    model.supportedGenerationMethods?.includes('generateContent') &&
                    model.name?.includes('gemini')
                )
                .map(model => ({
                    name: model.name.replace('models/', ''),
                    displayName: model.displayName,
                    description: model.description
                })) || [];

            // Prioritize flash models (faster, cheaper)
            const flashModels = validModels.filter(m =>
                m.name.includes('flash') || m.name.includes('Flash')
            );
            const proModels = validModels.filter(m =>
                m.name.includes('pro') || m.name.includes('Pro')
            );
            const otherModels = validModels.filter(m =>
                !m.name.includes('flash') && !m.name.includes('Flash') &&
                !m.name.includes('pro') && !m.name.includes('Pro')
            );

            // Order: flash first (newest), then pro, then others
            this.availableModels = [
                ...flashModels.sort((a, b) => b.name.localeCompare(a.name)),
                ...proModels.sort((a, b) => b.name.localeCompare(a.name)),
                ...otherModels
            ];

            this.modelsLoaded = true;
            console.log('✅ Discovered models:', this.availableModels.map(m => m.name));

            return this.availableModels.length > 0
                ? this.availableModels
                : this.getFallbackModels();

        } catch (error) {
            console.warn('Error discovering models:', error.message);
            return this.getFallbackModels();
        }
    }

    /**
     * Fallback model list (updated for 2024/2025)
     */
    getFallbackModels() {
        return [
            { name: 'gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash Experimental' },
            { name: 'gemini-1.5-flash-latest', displayName: 'Gemini 1.5 Flash' },
            { name: 'gemini-1.5-pro-latest', displayName: 'Gemini 1.5 Pro' },
            { name: 'gemini-pro', displayName: 'Gemini Pro' },
            { name: 'gemini-1.0-pro', displayName: 'Gemini 1.0 Pro' }
        ];
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        const status = error.status;
        if (status && RETRY_CONFIG.retryableErrors.includes(status)) {
            return true;
        }
        const retryableMessages = [
            'high demand',
            'temporarily unavailable',
            'overloaded',
            'service unavailable',
            'try again later',
            'Failed to fetch',
            'NetworkError',
            'ECONNRESET',
            'ETIMEDOUT'
        ];
        return retryableMessages.some(msg =>
            error.message?.toLowerCase().includes(msg)
        );
    }

    /**
     * Try request with a specific model
     */
    async tryWithModel(modelName, requestBody) {
        const url = `${API_BASE}/models/${modelName}:generateContent`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP error! Status: ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) { }

                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return { success: true, data, model: modelName };

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                const timeoutError = new Error(`Request timeout for ${modelName}`);
                timeoutError.status = 408;
                throw timeoutError;
            }

            if (!error.status) {
                const statusMatch = error.message?.match(/Status:\s*(\d{3})/);
                error.status = statusMatch ? parseInt(statusMatch[1]) : 0;
            }
            throw error;
        }
    }

    /**
     * Main API call with retry and fallback
     */
    async callAPIWithRetry(requestBody) {
        // Discover available models first
        const models = await this.discoverModels();

        // Build list of models to try
        let modelsToTry = models.map(m => m.name);

        // If we have a last successful model, try it first
        if (this.lastSuccessfulModel) {
            modelsToTry = [
                this.lastSuccessfulModel,
                ...modelsToTry.filter(m => m !== this.lastSuccessfulModel)
            ];
        }

        // Remove duplicates
        modelsToTry = [...new Set(modelsToTry)];

        console.log('🔄 Will try models in order:', modelsToTry);

        let lastError = null;

        for (const model of modelsToTry) {
            for (let attempt = 0; attempt < RETRY_CONFIG.maxRetries; attempt++) {
                try {
                    this.isRetrying = attempt > 0;
                    this.retryCount = attempt;

                    console.log(`📝 Trying ${model} (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);

                    const result = await this.tryWithModel(model, requestBody);

                    // Success!
                    this.lastSuccessfulModel = model;
                    this.isRetrying = false;
                    this.retryCount = 0;

                    console.log(`✅ Success with model: ${model}`);
                    return result;

                } catch (error) {
                    lastError = error;

                    // 404 = model not found, skip to next model immediately
                    if (error.status === 404) {
                        console.warn(`❌ Model ${model} not found, skipping...`);
                        break; // Break retry loop, move to next model
                    }

                    // Non-retryable errors, try next model
                    if (!this.isRetryableError(error)) {
                        console.warn(`❌ Model ${model} failed with non-retryable error: ${error.message}`);
                        break;
                    }

                    // Retryable error - wait and retry same model
                    if (attempt < RETRY_CONFIG.maxRetries - 1) {
                        const delay = this.getRetryDelay(attempt);
                        console.log(`⏳ Retrying ${model} in ${Math.round(delay)}ms...`);
                        await this.sleep(delay);
                    } else {
                        console.warn(`❌ Model ${model} failed after ${RETRY_CONFIG.maxRetries} attempts`);
                    }
                }
            }
        }

        this.isRetrying = false;
        this.retryCount = 0;
        throw lastError || new Error('All models failed');
    }

    /**
     * Get offline fallback response
     */
    getOfflineFallback(userMessage) {
        const isEnglish = this.detectIsEnglish(userMessage);
        const langKey = isEnglish ? 'english' : 'somali';
        const lowerMessage = userMessage.toLowerCase();

        let category = 'general';

        const categories = {
            anxiety: ['anxious', 'anxiety', 'panic', 'worry', 'worried', 'nervous', 'cabsi', 'qalloocan', 'murug', 'walwalo'],
            stress: ['stress', 'stressed', 'overwhelm', 'pressure', 'busy', 'strasi', 'dhibaato', 'xasilooni', 'walaac'],
            sad: ['sad', 'depressed', 'depression', 'unhappy', 'down', 'lonely', 'xun', 'murugo', 'qoomame', 'aan la faraxin'],
            sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'fatigue', 'hurda', 'daalin', 'daalim', 'aan hurdin']
        };

        for (const [cat, keywords] of Object.entries(categories)) {
            if (keywords.some(kw => lowerMessage.includes(kw))) {
                category = cat;
                break;
            }
        }

        const responses = OFFLINE_RESPONSES[langKey][category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Main send message function
     */
    async sendMessage(userMessage) {
        try {
            if (!userMessage || userMessage.trim() === '') {
                throw new Error('Message cannot be empty.');
            }

            const isEnglish = this.detectIsEnglish(userMessage);

            // Check for emergency
            if (this.isEmergencyRequest(userMessage)) {
                return {
                    success: true,
                    message: isEnglish ? EMERGENCY_RESOURCES_ENGLISH : EMERGENCY_RESOURCES_SOMALI,
                    timestamp: new Date().toISOString(),
                    isEmergency: true
                };
            }

            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            // Trim history
            if (this.conversationHistory.length > this.maxHistoryLength) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
                if (this.conversationHistory[0].role === 'model') {
                    this.conversationHistory.shift();
                }
            }

            // Prepare request
            const requestBody = {
                systemInstruction: {
                    parts: [{ text: CLINICAL_SYSTEM_PROMPT }]
                },
                contents: this.conversationHistory,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500
                }
            };

            // Try API
            let aiMessage;
            let usedOffline = false;
            let usedModel = null;

            try {
                const result = await this.callAPIWithRetry(requestBody);
                aiMessage = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
                usedModel = result.model;

                if (!aiMessage) {
                    throw new Error('Empty response from API');
                }
            } catch (apiError) {
                console.error('❌ All API attempts failed, using offline fallback:', apiError.message);
                aiMessage = this.getOfflineFallback(userMessage);
                usedOffline = true;
            }

            // Add AI response to history
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: aiMessage }]
            });

            return {
                success: true,
                message: aiMessage,
                timestamp: new Date().toISOString(),
                conversationId: this.generateConversationId(),
                model: usedOffline ? 'offline-fallback' : usedModel,
                isOfflineFallback: usedOffline
            };

        } catch (error) {
            console.error('Chatbot Service Error:', error);

            // Remove failed user message from history
            if (this.conversationHistory.length > 0 &&
                this.conversationHistory[this.conversationHistory.length - 1].role === 'user') {
                this.conversationHistory.pop();
            }

            const fallbackMessage = this.getOfflineFallback(userMessage);

            return {
                success: false,
                error: error.message,
                fallbackMessage: fallbackMessage,
                timestamp: new Date().toISOString(),
                isOfflineFallback: true
            };
        }
    }

    /**
     * Get retry status for UI
     */
    getRetryStatus() {
        return {
            isRetrying: this.isRetrying,
            retryCount: this.retryCount,
            maxRetries: RETRY_CONFIG.maxRetries,
            currentModel: this.lastSuccessfulModel || 'discovering...',
            availableModels: this.availableModels.length,
            modelsLoaded: this.modelsLoaded
        };
    }

    /**
     * Force refresh model list
     */
    async refreshModels() {
        this.modelsLoaded = false;
        this.availableModels = [];
        return this.discoverModels();
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

    getEmergencyResponse(isEnglish) {
        return isEnglish ? EMERGENCY_RESOURCES_ENGLISH : EMERGENCY_RESOURCES_SOMALI;
    }

    detectIsEnglish(message) {
        const englishWords = ['the', 'and', 'is', 'you', 'are', 'help', 'feel', 'sad', 'anxious', 'depressed', 'i', 'my', 'how', 'what', 'can'];
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
