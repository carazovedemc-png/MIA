// ===== КОНСТАНТЫ И СОСТОЯНИЕ =====
const tg = window.Telegram.WebApp;

// Состояние приложения
const state = {
    // Настройки API
    apiKey: localStorage.getItem('ai_api_key') || '',
    apiUrl: localStorage.getItem('ai_api_url') || 'https://api.deepseek.com/v1',
    apiModel: localStorage.getItem('ai_api_model') || 'deepseek-chat',
    apiProvider: localStorage.getItem('ai_api_provider') || 'deepseek',
    
    // Сообщения
    messages: [],
    isTyping: false,
    
    // Настройки интерфейса
    theme: localStorage.getItem('app_theme') || 'dark',
    autoScroll: localStorage.getItem('auto_scroll') !== 'false',
    showTimestamps: localStorage.getItem('show_timestamps') !== 'false',
    
    // Параметры AI
    maxTokens: parseInt(localStorage.getItem('max_tokens')) || 2000,
    temperature: parseFloat(localStorage.getItem('temperature')) || 0.7,
    systemPrompt: localStorage.getItem('system_prompt') || 'Ты - полезный AI-ассистент. Отвечай на русском языке.',
    
    // Статус
    apiStatus: 'disconnected' // 'disconnected', 'connected', 'error'
};

// Кэш DOM элементов
const elements = {
    // Основные элементы
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    messagesContainer: document.getElementById('messagesContainer'),
    
    // Кнопки управления
    settingsBtn: document.getElementById('settingsBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    
    // Модальное окно
    settingsModal: document.getElementById('settingsModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    
    // Поля настроек
    apiProvider: document.getElementById('apiProvider'),
    apiKey: document.getElementById('apiKey'),
    apiUrl: document.getElementById('apiUrl'),
    apiModel: document.getElementById('apiModel'),
    toggleKeyBtn: document.getElementById('toggleKeyBtn'),
    
    // Слайдеры
    maxTokens: document.getElementById('maxTokens'),
    temperature: document.getElementById('temperature'),
    tokensValue: document.getElementById('tokensValue'),
    tempValue: document.getElementById('tempValue'),
    
    // Чекбоксы
    autoScroll: document.getElementById('autoScroll'),
    showTimestamps: document.getElementById('showTimestamps'),
    systemPrompt: document.getElementById('systemPrompt'),
    
    // Кнопка теста API
    testApiBtn: document.getElementById('testApiBtn'),
    apiTestResult: document.getElementById('apiTestResult'),
    
    // Индикатор статуса
    statusDot: document.querySelector('.status-dot'),
    statusText: document.getElementById('statusText'),
    
    // Темы
    themeOptions: document.querySelectorAll('.theme-option')
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Инициализация Telegram
    initTelegram();
    
    // 2. Загрузка состояния
    loadState();
    
    // 3. Настройка обработчиков
    setupEventListeners();
    
    // 4. Применение темы
    applyTheme();
    
    // 5. Проверка API
    updateApiStatus();
    
    // 6. Настройка автовысоты textarea
    setupTextareaAutoResize();
    
    console.log('AI Assistant initialized');
}

function initTelegram() {
    if (typeof tg !== 'undefined') {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#0f172a');
        console.log('Telegram Web App initialized');
    } else {
        console.warn('Telegram Web App SDK not found. Running in standalone mode.');
    }
}

function loadState() {
    // Загрузка значений в форму настроек
    elements.apiProvider.value = state.apiProvider;
    elements.apiKey.value = state.apiKey;
    elements.apiUrl.value = state.apiUrl;
    elements.apiModel.value = state.apiModel;
    elements.maxTokens.value = state.maxTokens;
    elements.temperature.value = state.temperature;
    elements.autoScroll.checked = state.autoScroll;
    elements.showTimestamps.checked = state.showTimestamps;
    elements.systemPrompt.value = state.systemPrompt;
    
    // Обновление отображения слайдеров
    updateSliderValues();
    
    // Обновление статуса API
    if (state.apiKey) {
        testApiConnectionSilent();
    }
}

function setupEventListeners() {
    // ===== ОТПРАВКА СООБЩЕНИЙ =====
    elements.sendButton.addEventListener('click', sendMessage);
    
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    elements.messageInput.addEventListener('input', () => {
        elements.sendButton.disabled = !elements.messageInput.value.trim();
    });
    
    // ===== УПРАВЛЕНИЕ ЧАТОМ =====
    elements.clearChatBtn.addEventListener('click', clearChat);
    
    // ===== НАСТРОЙКИ =====
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeModalBtn.addEventListener('click', closeSettings);
    elements.cancelSettingsBtn.addEventListener('click', closeSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Показать/скрыть API ключ
    elements.toggleKeyBtn.addEventListener('click', () => {
        const type = elements.apiKey.type;
        elements.apiKey.type = type === 'password' ? 'text' : 'password';
        elements.toggleKeyBtn.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye-slash"></i>' : 
            '<i class="fas fa-eye"></i>';
    });
    
    // Изменение провайдера API
    elements.apiProvider.addEventListener('change', updateApiProvider);
    
    // Слайдеры
    elements.maxTokens.addEventListener('input', () => {
        elements.tokensValue.textContent = `${elements.maxTokens.value} токенов`;
    });
    
    elements.temperature.addEventListener('input', () => {
        const value = parseFloat(elements.temperature.value);
        let label = '';
        
        if (value === 0) label = ' (точность)';
        else if (value <= 0.3) label = ' (консервативно)';
        else if (value <= 0.7) label = ' (баланс)';
        else if (value <= 0.9) label = ' (креативно)';
        else label = ' (экспериментально)';
        
        elements.tempValue.textContent = `${value}${label}`;
    });
    
    // Тест API
    elements.testApiBtn.addEventListener('click', testApiConnection);
    
    // Выбор темы
    elements.themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.getAttribute('data-theme');
            selectTheme(theme);
        });
    });
    
    // Закрытие модального окна по клику вне его
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });
    
    // Обработка системного промпта
    elements.systemPrompt.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// ===== РАБОТА С ТЕКСТОВЫМ ПОЛЕМ =====
function setupTextareaAutoResize() {
    const textarea = elements.messageInput;
    
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
    
    // Фокус на поле ввода при загрузке
    setTimeout(() => {
        textarea.focus();
    }, 500);
}

// ===== УПРАВЛЕНИЕ СООБЩЕНИЯМИ =====
async function sendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text) {
        showNotification('Введите сообщение', 'warning');
        return;
    }
    
    if (!state.apiKey) {
        showNotification('Настройте API ключ в настройках', 'error');
        openSettings();
        return;
    }
    
    // Добавляем сообщение пользователя
    addMessage('user', text);
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';
    elements.sendButton.disabled = true;
    
    // Показываем индикатор печати
    const loadingId = addMessage('ai', 'Думаю...', true);
    
    try {
        const response = await callAIAPI(text);
        
        // Удаляем индикатор загрузки
        removeMessage(loadingId);
        
        // Добавляем ответ
        if (response.success) {
            addMessage('ai', response.message);
            updateApiStatus('connected');
            
            // Автопрокрутка
            if (state.autoScroll) {
                scrollToBottom();
            }
        } else {
            addMessage('system', `Ошибка: ${response.error}`);
            updateApiStatus('error');
            
            // Предлагаем проверить настройки для определенных ошибок
            if (response.error.includes('ключ') || response.error.includes('402') || response.error.includes('401')) {
                setTimeout(() => {
                    if (confirm('Проверить настройки API?')) {
                        openSettings();
                    }
                }, 1000);
            }
        }
        
    } catch (error) {
        removeMessage(loadingId);
        addMessage('system', `Ошибка сети: ${error.message}`);
        updateApiStatus('error');
    }
}

async function callAIAPI(userMessage) {
    const endpoint = state.apiUrl.replace(/\/$/, '') + '/chat/completions';
    
    const messages = [];
    
    // Добавляем системный промпт если задан
    if (state.systemPrompt.trim()) {
        messages.push({
            role: 'system',
            content: state.systemPrompt
        });
    }
    
    // Добавляем историю сообщений (последние 10)
    const recentMessages = state.messages.slice(-10);
    recentMessages.forEach(msg => {
        if (msg.type === 'user') {
            messages.push({ role: 'user', content: msg.text });
        } else if (msg.type === 'ai') {
            messages.push({ role: 'assistant', content: msg.text });
        }
    });
    
    // Добавляем текущее сообщение
    messages.push({ role: 'user', content: userMessage });
    
    const requestBody = {
        model: state.apiModel,
        messages: messages,
        max_tokens: state.maxTokens,
        temperature: state.temperature,
        stream: false
    };
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            let errorMsg = data.error?.message || `Ошибка ${response.status}`;
            
            // Обработка специфичных ошибок
            if (response.status === 401) {
                errorMsg = 'Неверный API ключ. Проверьте ключ в настройках.';
            } else if (response.status === 402) {
                errorMsg = 'Проблема с оплатой API. Проверьте баланс на сайте провайдера.';
            } else if (response.status === 404) {
                errorMsg = 'Конечная точка API не найдена. Проверьте URL API.';
            } else if (response.status === 429) {
                errorMsg = 'Слишком много запросов. Подождите немного.';
            } else if (response.status >= 500) {
                errorMsg = 'Ошибка сервера AI. Попробуйте позже.';
            }
            
            return {
                success: false,
                error: errorMsg
            };
        }
        
        if (data.choices && data.choices[0]) {
            return {
                success: true,
                message: data.choices[0].message.content,
                usage: data.usage
            };
        } else {
            return {
                success: false,
                error: 'Неожиданный формат ответа от AI'
            };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error.message.includes('Failed to fetch') ? 
                'Ошибка сети. Проверьте подключение к интернету.' : 
                `Ошибка: ${error.message}`
        };
    }
}

function addMessage(type, text, isLoading = false) {
    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date();
    
    const message = {
        id,
        type,
        text,
        timestamp,
        isLoading
    };
    
    state.messages.push(message);
    
    // Ограничиваем историю (последние 50 сообщений)
    if (state.messages.length > 50) {
        state.messages = state.messages.slice(-50);
    }
    
    // Рендерим сообщение
    renderMessage(message);
    
    return id;
}

function renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}-message`;
    messageDiv.id = message.id;
    
    const time = message.timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let avatarIcon = 'fas fa-user';
    let senderName = 'Вы';
    
    if (message.type === 'ai') {
        avatarIcon = 'fas fa-robot';
        senderName = 'AI Assistant';
    } else if (message.type === 'system') {
        avatarIcon = 'fas fa-info-circle';
        senderName = 'Система';
    }
    
    if (message.isLoading) {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-sender">${senderName}</div>
                <div class="message-text">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Форматирование текста
        let formattedText = formatMessageText(message.text);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="message-content">
                <div class="message-sender">${senderName}</div>
                <div class="message-text">${formattedText}</div>
                ${state.showTimestamps ? `<div class="message-time">${time}</div>` : ''}
            </div>
        `;
    }
    
    elements.messagesContainer.appendChild(messageDiv);
    
    // Добавляем стили для индикатора печати
    if (message.isLoading) {
        const style = document.createElement('style');
        style.textContent = `
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 8px 0;
            }
            .typing-indicator span {
                width: 8px;
                height: 8px;
                background: var(--text-secondary);
                border-radius: 50%;
                animation: typingBounce 1.4s infinite ease-in-out;
            }
            .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
            .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typingBounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-6px); }
            }
        `;
        document.head.appendChild(style);
    }
}

function formatMessageText(text) {
    // Заменяем Markdown на HTML
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n/g, '<br>')
        .replace(/# (.*?)(?=\n|$)/g, '<h3>$1</h3>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="link">$1</a>');
}

function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
    state.messages = state.messages.filter(msg => msg.id !== id);
}

function clearChat() {
    if (state.messages.length > 1 && confirm('Очистить всю историю сообщений?')) {
        // Сохраняем только приветственное сообщение
        const welcomeMsg = state.messages.find(msg => msg.type === 'ai' && msg.text.includes('Привет!'));
        state.messages = welcomeMsg ? [welcomeMsg] : [];
        
        // Очищаем контейнер
        elements.messagesContainer.innerHTML = '';
        
        // Перерисовываем сохраненное сообщение
        if (welcomeMsg) {
            renderMessage(welcomeMsg);
        }
        
        showNotification('История сообщений очищена', 'success');
    }
}

// ===== НАСТРОЙКИ =====
function openSettings() {
    elements.settingsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Обновляем значения в форме
    elements.apiProvider.value = state.apiProvider;
    elements.apiKey.value = state.apiKey;
    elements.apiUrl.value = state.apiUrl;
    elements.apiModel.value = state.apiModel;
    elements.maxTokens.value = state.maxTokens;
    elements.temperature.value = state.temperature;
    elements.autoScroll.checked = state.autoScroll;
    elements.showTimestamps.checked = state.showTimestamps;
    elements.systemPrompt.value = state.systemPrompt;
    
    updateSliderValues();
    updateApiProvider();
}

function closeSettings() {
    elements.settingsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    elements.messageInput.focus();
}

function saveSettings() {
    // Сохраняем значения из формы
    state.apiProvider = elements.apiProvider.value;
    state.apiKey = elements.apiKey.value.trim();
    state.apiUrl = elements.apiUrl.value.trim() || getDefaultApiUrl(state.apiProvider);
    state.apiModel = elements.apiModel.value.trim() || getDefaultModel(state.apiProvider);
    state.maxTokens = parseInt(elements.maxTokens.value);
    state.temperature = parseFloat(elements.temperature.value);
    state.autoScroll = elements.autoScroll.checked;
    state.showTimestamps = elements.showTimestamps.checked;
    state.systemPrompt = elements.systemPrompt.value.trim();
    
    // Сохраняем в localStorage
    localStorage.setItem('ai_api_key', state.apiKey);
    localStorage.setItem('ai_api_url', state.apiUrl);
    localStorage.setItem('ai_api_model', state.apiModel);
    localStorage.setItem('ai_api_provider', state.apiProvider);
    localStorage.setItem('max_tokens', state.maxTokens);
    localStorage.setItem('temperature', state.temperature);
    localStorage.setItem('auto_scroll', state.autoScroll);
    localStorage.setItem('show_timestamps', state.showTimestamps);
    localStorage.setItem('system_prompt', state.systemPrompt);
    localStorage.setItem('app_theme', state.theme);
    
    // Проверяем API соединение
    if (state.apiKey) {
        testApiConnectionSilent();
    } else {
        updateApiStatus('disconnected');
    }
    
    showNotification('Настройки сохранены', 'success');
    closeSettings();
    
    // Добавляем системное сообщение
    addMessage('system', 'Настройки обновлены. API ключ сохранён.');
}

function updateApiProvider() {
    const provider = elements.apiProvider.value;
    
    // Автоматически заполняем URL и модель для известных провайдеров
    if (provider !== 'custom') {
        elements.apiUrl.value = getDefaultApiUrl(provider);
        elements.apiModel.value = getDefaultModel(provider);
        
        // Делаем поля только для чтения
        elements.apiUrl.readOnly = true;
        elements.apiModel.readOnly = true;
        elements.apiUrl.style.opacity = '0.7';
        elements.apiModel.style.opacity = '0.7';
    } else {
        // Для custom разрешаем редактирование
        elements.apiUrl.readOnly = false;
        elements.apiModel.readOnly = false;
        elements.apiUrl.style.opacity = '1';
        elements.apiModel.style.opacity = '1';
    }
}

function getDefaultApiUrl(provider) {
    const urls = {
        'deepseek': 'https://api.deepseek.com/v1',
        'openai': 'https://api.openai.com/v1'
    };
    return urls[provider] || 'https://api.deepseek.com/v1';
}

function getDefaultModel(provider) {
    const models = {
        'deepseek': 'deepseek-chat',
        'openai': 'gpt-3.5-turbo'
    };
    return models[provider] || 'deepseek-chat';
}

function updateSliderValues() {
    elements.tokensValue.textContent = `${elements.maxTokens.value} токенов`;
    
    const tempValue = parseFloat(elements.temperature.value);
    let tempLabel = '';
    
    if (tempValue === 0) tempLabel = ' (точность)';
    else if (tempValue <= 0.3) tempLabel = ' (консервативно)';
    else if (tempValue <= 0.7) tempLabel = ' (баланс)';
    else if (tempValue <= 0.9) tempLabel = ' (креативно)';
    else tempLabel = ' (экспериментально)';
    
    elements.tempValue.textContent = `${tempValue}${tempLabel}`;
}

// ===== ТЕСТИРОВАНИЕ API =====
async function testApiConnection() {
    const apiKey = elements.apiKey.value.trim();
    const apiUrl = elements.apiUrl.value.trim() || getDefaultApiUrl(elements.apiProvider.value);
    
    if (!apiKey) {
        elements.apiTestResult.textContent = 'Введите API ключ';
        elements.apiTestResult.className = 'test-result error';
        elements.apiTestResult.style.display = 'block';
        return;
    }
    
    elements.testApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
    elements.testApiBtn.disabled = true;
    
    try {
        const endpoint = apiUrl.replace(/\/$/, '') + '/models';
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            elements.apiTestResult.textContent = '✅ Соединение с API успешно установлено!';
            elements.apiTestResult.className = 'test-result success';
            updateApiStatus('connected');
        } else if (response.status === 401) {
            elements.apiTestResult.textContent = '❌ Неверный API ключ. Проверьте ключ.';
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        } else if (response.status === 402) {
            elements.apiTestResult.textContent = '❌ Проблема с оплатой API. Проверьте баланс.';
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        } else if (response.status === 404) {
            elements.apiTestResult.textContent = '❌ Конечная точка API не найдена. Проверьте URL.';
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        } else {
            const errorText = await response.text();
            elements.apiTestResult.textContent = `❌ Ошибка сервера: ${response.status}`;
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        }
        
        elements.apiTestResult.style.display = 'block';
        
    } catch (error) {
        elements.apiTestResult.textContent = '❌ Ошибка сети. Проверьте подключение.';
        elements.apiTestResult.className = 'test-result error';
        elements.apiTestResult.style.display = 'block';
        updateApiStatus('error');
    } finally {
        elements.testApiBtn.innerHTML = '<i class="fas fa-vial"></i> Проверить соединение';
        elements.testApiBtn.disabled = false;
    }
}

async function testApiConnectionSilent() {
    if (!state.apiKey) return;
    
    try {
        const endpoint = state.apiUrl.replace(/\/$/, '') + '/models';
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${state.apiKey}`
            }
        });
        
        if (response.ok) {
            updateApiStatus('connected');
        } else {
            updateApiStatus('error');
        }
    } catch (error) {
        updateApiStatus('error');
    }
}

function updateApiStatus(status) {
    state.apiStatus = status;
    
    elements.statusDot.className = 'status-dot';
    elements.statusText.textContent = 'Не подключено';
    
    switch(status) {
        case 'connected':
            elements.statusDot.classList.add('connected');
            elements.statusText.textContent = 'Подключено';
            break;
        case 'error':
            elements.statusDot.classList.add('error');
            elements.statusText.textContent = 'Ошибка API';
            break;
        case 'disconnected':
            elements.statusDot.style.background = 'var(--warning)';
            elements.statusText.textContent = 'Не подключено';
            break;
    }
}

// ===== ТЕМЫ =====
function selectTheme(theme) {
    state.theme = theme;
    applyTheme();
    
    // Обновляем активную кнопку
    elements.themeOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.getAttribute('data-theme') === theme) {
            opt.classList.add('active');
        }
    });
    
    // Сохраняем в localStorage
    localStorage.setItem('app_theme', theme);
}

function applyTheme() {
    document.body.classList.remove('dark-theme', 'light-theme', 'blue-theme');
    document.body.classList.add(`${state.theme}-theme`);
    
    // Обновляем Telegram цвет фона
    if (typeof tg !== 'undefined') {
        const bgColor = getComputedStyle(document.body).getPropertyValue('--bg-primary').trim();
        tg.setBackgroundColor(bgColor);
    }
}

// ===== УТИЛИТЫ =====
function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${type === 'success' ? 'var(--success)' : 
                     type === 'error' ? 'var(--error)' : 
                     type === 'warning' ? 'var(--warning)' : 'var(--accent-primary)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Автоматическое удаление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    // Добавляем стили для анимаций
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация завершена
console.log('AI Assistant ready to use!');