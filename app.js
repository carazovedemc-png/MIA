// Telegram Web App инициализация
const tg = window.Telegram.WebApp;

// Состояние приложения
const state = {
    apiKey: localStorage.getItem('deepseek_api_key') || '',
    messages: [],
    isShift: false,
    theme: localStorage.getItem('app_theme') || 'dark',
    keyboardVisible: true,
    apiStatus: 'disconnected'
};

// Основные элементы DOM
const elements = {
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    messagesContainer: document.getElementById('messagesContainer'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeModalBtn: document.querySelector('.close-modal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    toggleKeyBtn: document.getElementById('toggleKeyBtn'),
    testApiBtn: document.getElementById('testApiBtn'),
    apiTestResult: document.getElementById('apiTestResult'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiStatusLight: document.getElementById('apiStatusLight'),
    apiStatusText: document.getElementById('apiStatusText'),
    keyboard: document.getElementById('keyboard'),
    toggleKeyboard: document.getElementById('toggleKeyboard'),
    keyboardSound: document.getElementById('keyboardSound'),
    clearBtn: document.getElementById('clearBtn'),
    themeOptions: document.querySelectorAll('.theme-option'),
    quickButtons: document.querySelectorAll('.quick-btn')
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
    loadState();
    setupEventListeners();
    applyTheme();
    updateApiStatus();
    renderMessages();

    // Проверка API ключа при загрузке
    if (state.apiKey) {
        checkApiKey(state.apiKey);
    }
});

// Инициализация Telegram
function initTelegram() {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#0a0a0f');
    
    // Добавляем системное сообщение
    addMessage('system', 'Telegram Web App инициализирован. Готов к работе!');
}

// Загрузка состояния
function loadState() {
    // Тема
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
        state.theme = savedTheme;
    }
    
    // Клавиатура
    const keyboardVisible = localStorage.getItem('keyboard_visible');
    if (keyboardVisible !== null) {
        state.keyboardVisible = keyboardVisible === 'true';
        elements.keyboard.style.display = state.keyboardVisible ? 'grid' : 'none';
        elements.toggleKeyboard.checked = state.keyboardVisible;
    }
    
    // Звук
    const keyboardSound = localStorage.getItem('keyboard_sound');
    if (keyboardSound !== null) {
        elements.keyboardSound.checked = keyboardSound === 'true';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Отправка сообщения
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Быстрые кнопки
    elements.quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-text');
            elements.messageInput.value = text;
            elements.messageInput.focus();
        });
    });

    // Настройки
    elements.settingsBtn.addEventListener('click', () => {
        elements.apiKeyInput.value = state.apiKey;
        elements.settingsModal.style.display = 'flex';
    });

    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.closeSettingsBtn.addEventListener('click', closeModal);

    // Показать/скрыть API ключ
    elements.toggleKeyBtn.addEventListener('click', () => {
        const type = elements.apiKeyInput.type;
        elements.apiKeyInput.type = type === 'password' ? 'text' : 'password';
        elements.toggleKeyBtn.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye-slash"></i>' : 
            '<i class="fas fa-eye"></i>';
    });

    // Проверка API
    elements.testApiBtn.addEventListener('click', testApiConnection);

    // Сохранение настроек
    elements.saveSettingsBtn.addEventListener('click', saveSettings);

    // Очистка чата
    elements.clearBtn.addEventListener('click', () => {
        if (confirm('Очистить всю историю сообщений?')) {
            state.messages = [];
            renderMessages();
            addMessage('system', 'История сообщений очищена.');
        }
    });

    // Переключение темы
    elements.themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            elements.themeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            state.theme = option.getAttribute('data-theme');
            applyTheme();
        });
    });

    // Управление клавиатурой
    elements.toggleKeyboard.addEventListener('change', (e) => {
        state.keyboardVisible = e.target.checked;
        elements.keyboard.style.display = state.keyboardVisible ? 'grid' : 'none';
        localStorage.setItem('keyboard_visible', state.keyboardVisible);
    });

    // Виртуальная клавиатура
    setupVirtualKeyboard();

    // Закрытие модального окна
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeModal();
        }
    });
}

// Настройка виртуальной клавиатуры
function setupVirtualKeyboard() {
    const keys = document.querySelectorAll('.key');
    
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.getAttribute('data-key');
            const input = elements.messageInput;
            
            // Звук нажатия
            if (elements.keyboardSound.checked) {
                playKeySound();
            }
            
            // Обработка специальных клавиш
            switch(keyValue) {
                case 'backspace':
                    input.value = input.value.slice(0, -1);
                    break;
                    
                case 'enter':
                    sendMessage();
                    break;
                    
                case 'space':
                    input.value += ' ';
                    break;
                    
                case 'shift':
                    state.isShift = !state.isShift;
                    key.classList.toggle('active', state.isShift);
                    updateKeyboardCase();
                    break;
                    
                case 'numbers':
                    // Переключение на цифровую клавиатуру (упрощённо)
                    const isNumbers = key.textContent === '123';
                    key.textContent = isNumbers ? 'ABC' : '123';
                    key.setAttribute('data-key', isNumbers ? 'letters' : 'numbers');
                    break;
                    
                default:
                    if (keyValue.length === 1) {
                        const char = state.isShift ? keyValue.toUpperCase() : keyValue.toLowerCase();
                        input.value += char;
                        
                        // Автоматически выключаем Shift после одной буквы
                        if (state.isShift && keyValue.match(/[a-z]/)) {
                            state.isShift = false;
                            document.querySelector('[data-key="shift"]').classList.remove('active');
                            updateKeyboardCase();
                        }
                    }
            }
            
            input.focus();
            input.scrollLeft = input.scrollWidth;
        });
    });
}

// Обновление регистра клавиш
function updateKeyboardCase() {
    const letterKeys = document.querySelectorAll('.key[data-key^=""]');
    letterKeys.forEach(key => {
        const keyValue = key.getAttribute('data-key');
        if (keyValue && keyValue.length === 1) {
            key.textContent = state.isShift ? keyValue.toUpperCase() : keyValue.toLowerCase();
        }
    });
}

// Отправка сообщения
async function sendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text) {
        showNotification('Введите сообщение', 'error');
        return;
    }
    
    if (!state.apiKey) {
        showNotification('Настройте API ключ в настройках', 'error');
        elements.settingsModal.style.display = 'flex';
        return;
    }
    
    // Добавляем сообщение пользователя
    addMessage('user', text);
    elements.messageInput.value = '';
    
    // Показываем индикатор загрузки
    const loadingId = addMessage('ai', 'Думаю...', true);
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: text }],
                max_tokens: 2000,
                temperature: 0.7,
                stream: false
            })
        });
        
        // Обработка ошибок API
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Ошибка 402 - Payment Required
            if (response.status === 402) {
                throw new Error('Проблема с API ключом. Проверьте баланс или валидность ключа на platform.deepseek.com');
            }
            
            // Другие ошибки
            throw new Error(errorData.error?.message || `Ошибка API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Удаляем индикатор загрузки
        removeMessage(loadingId);
        
        // Добавляем ответ
        if (data.choices && data.choices[0]) {
            addMessage('ai', data.choices[0].message.content);
            updateApiStatus('connected');
        }
        
    } catch (error) {
        removeMessage(loadingId);
        
        // Показываем понятную ошибку
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Проблема с интернет-соединением. Проверьте подключение.';
        } else if (error.message.includes('402')) {
            errorMessage = '❌ Проблема с API ключом DeepSeek:\n1. Проверьте баланс на platform.deepseek.com\n2. Убедитесь, что ключ активен\n3. При необходимости создайте новый ключ';
        }
        
        addMessage('system', `Ошибка: ${errorMessage}`);
        updateApiStatus('error');
        
        // Предлагаем проверить настройки
        if (error.message.includes('402') || error.message.includes('ключ')) {
            setTimeout(() => {
                if (confirm('Открыть настройки для проверки API ключа?')) {
                    elements.settingsModal.style.display = 'flex';
                }
            }, 1000);
        }
    }
}

// Добавление сообщения
function addMessage(type, text, isLoading = false) {
    const id = 'msg_' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    const message = {
        id,
        type,
        text,
        timestamp: new Date(),
        isLoading
    };
    
    state.messages.push(message);
    renderMessage(message);
    
    // Прокрутка вниз
    setTimeout(() => {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }, 100);
    
    return id;
}

// Отрисовка сообщения
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
        senderName = 'DeepSeek AI';
    } else if (message.type === 'system') {
        avatarIcon = 'fas fa-info-circle';
        senderName = 'Система';
    }
    
    if (message.isLoading) {
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="content">
                <div class="sender">${senderName}</div>
                <div class="text">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div class="time">${time}</div>
            </div>
        `;
    } else {
        // Форматирование текста
        let formattedText = message.text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$2</code></pre>');
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="${avatarIcon}"></i>
            </div>
            <div class="content">
                <div class="sender">${senderName}</div>
                <div class="text">${formattedText}</div>
                <div class="time">${time}</div>
            </div>
        `;
    }
    
    elements.messagesContainer.appendChild(messageDiv);
}

// Отрисовка всех сообщений
function renderMessages() {
    elements.messagesContainer.innerHTML = '';
    state.messages.forEach(msg => renderMessage(msg));
}

// Удаление сообщения
function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
    state.messages = state.messages.filter(msg => msg.id !== id);
}

// Проверка API ключа
async function checkApiKey(apiKey) {
    if (!apiKey) {
        updateApiStatus('disconnected');
        return;
    }
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            updateApiStatus('connected');
            showNotification('API ключ работает!', 'success');
        } else {
            updateApiStatus('error');
        }
    } catch (error) {
        updateApiStatus('error');
    }
}

// Тестирование соединения с API
async function testApiConnection() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
        elements.apiTestResult.textContent = 'Введите API ключ';
        elements.apiTestResult.className = 'test-result error';
        elements.apiTestResult.style.display = 'block';
        return;
    }
    
    elements.testApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
    elements.testApiBtn.disabled = true;
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            elements.apiTestResult.textContent = '✅ Соединение с DeepSeek API успешно установлено!';
            elements.apiTestResult.className = 'test-result success';
            updateApiStatus('connected');
        } else if (response.status === 401) {
            elements.apiTestResult.textContent = '❌ Неверный API ключ. Проверьте ключ на platform.deepseek.com';
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        } else if (response.status === 402) {
            elements.apiTestResult.textContent = '❌ Проблема с оплатой API. Проверьте баланс на platform.deepseek.com';
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        } else {
            elements.apiTestResult.textContent = `❌ Ошибка сервера: ${response.status}`;
            elements.apiTestResult.className = 'test-result error';
            updateApiStatus('error');
        }
        
        elements.apiTestResult.style.display = 'block';
        
    } catch (error) {
        elements.apiTestResult.textContent = '❌ Ошибка сети. Проверьте интернет-соединение.';
        elements.apiTestResult.className = 'test-result error';
        elements.apiTestResult.style.display = 'block';
        updateApiStatus('error');
    } finally {
        elements.testApiBtn.innerHTML = '<i class="fas fa-vial"></i> Проверить соединение';
        elements.testApiBtn.disabled = false;
    }
}

// Обновление статуса API
function updateApiStatus(status) {
    state.apiStatus = status;
    
    elements.apiStatusLight.className = 'status-indicator';
    elements.apiStatusText.textContent = 'API не настроен';
    
    switch(status) {
        case 'connected':
            elements.apiStatusLight.classList.add('connected');
            elements.apiStatusText.textContent = 'API подключён';
            break;
        case 'error':
            elements.apiStatusLight.style.background = 'var(--error)';
            elements.apiStatusText.textContent = 'Ошибка API';
            break;
        case 'disconnected':
            elements.apiStatusLight.style.background = 'var(--warning)';
            elements.apiStatusText.textContent = 'API не настроен';
            break;
    }
}

// Сохранение настроек
function saveSettings() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    // Сохраняем API ключ
    state.apiKey = apiKey;
    localStorage.setItem('deepseek_api_key', apiKey);
    
    // Сохраняем настройки клавиатуры
    localStorage.setItem('keyboard_visible', state.keyboardVisible);
    localStorage.setItem('keyboard_sound', elements.keyboardSound.checked);
    
    // Сохраняем тему
    localStorage.setItem('app_theme', state.theme);
    
    // Проверяем ключ
    if (apiKey) {
        checkApiKey(apiKey);
    } else {
        updateApiStatus('disconnected');
    }
    
    showNotification('Настройки сохранены', 'success');
    closeModal();
    
    // Добавляем системное сообщение
    addMessage('system', 'Настройки обновлены. API ключ сохранён.');
}

// Применение темы
function applyTheme() {
    document.body.classList.remove('dark-theme', 'light-theme', 'blue-theme');
    document.body.classList.add(`${state.theme}-theme`);
    
    // Обновляем активную кнопку темы
    elements.themeOptions.forEach(opt => {
        opt.classList.remove('active');
        if (opt.getAttribute('data-theme') === state.theme) {
            opt.classList.add('active');
        }
    });
    
    // Сохраняем в localStorage
    localStorage.setItem('app_theme', state.theme);
}

// Закрытие модального окна
function closeModal() {
    elements.settingsModal.style.display = 'none';
}

// Воспроизведение звука клавиши
function playKeySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600 + Math.random() * 200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Аудио не поддерживается, игнорируем
    }
}

// Показ уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
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
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    
    .key.active {
        background: var(--accent-primary) !important;
        color: white !important;
    }
`;
document.head.appendChild(style);

// Инициализация завершена
console.log('NeoChat AI Terminal initialized');