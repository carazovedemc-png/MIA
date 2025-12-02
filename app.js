// Инициализация Telegram Mini App
const tg = window.Telegram.WebApp;

// Основное состояние приложения
const state = {
    apiKey: localStorage.getItem('deepseek_api_key') || '',
    consoleColor: localStorage.getItem('console_color') || '#00ffff',
    messages: [],
    isTyping: false
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
    loadSettings();
    setupEventListeners();
    updateApiStatus();
});

// Инициализация Telegram Web App
function initTelegram() {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Настройка цветов Telegram
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#1a1a2e');
    
    console.log('Telegram Web App инициализирован');
    addSystemMessage('Telegram Web App: OK');
}

// Загрузка настроек
function loadSettings() {
    const savedColor = localStorage.getItem('console_color');
    if (savedColor) {
        document.documentElement.style.setProperty('--turquoise', savedColor);
        document.getElementById('consoleColor').value = savedColor;
    }
    
    const scanlines = localStorage.getItem('scanlines_effect') !== 'false';
    document.getElementById('scanlinesEffect').checked = scanlines;
    document.querySelector('.scanlines').style.display = scanlines ? 'block' : 'none';
    
    document.getElementById('blinkCursor').checked = localStorage.getItem('blink_cursor') !== 'false';
    document.getElementById('typeSound').checked = localStorage.getItem('type_sound') === 'true';
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка настроек
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.querySelector('.close-modal').addEventListener('click', closeSettings);
    
    // Сохранение настроек
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('testApi').addEventListener('click', testApiConnection);
    
    // Показать/скрыть API ключ
    document.getElementById('toggleKeyVisibility').addEventListener('click', toggleKeyVisibility);
    
    // Кнопки управления
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('clearBtn').addEventListener('click', clearConsole);
    document.getElementById('helpBtn').addEventListener('click', showHelp);
    
    // Поле ввода
    const aiInput = document.getElementById('aiInput');
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Ретро-клавиатура
    setupRetroKeyboard();
    
    // Закрытие модального окна по клику вне его
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeSettings();
        }
    });
}

// Настройка ретро-клавиатуры
function setupRetroKeyboard() {
    const keys = document.querySelectorAll('.key');
    const aiInput = document.getElementById('aiInput');
    
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const keyValue = key.getAttribute('data-key');
            
            // Воспроизведение звука (если включено)
            if (document.getElementById('typeSound').checked) {
                playKeySound();
            }
            
            switch(keyValue) {
                case 'backspace':
                    aiInput.value = aiInput.value.slice(0, -1);
                    break;
                case 'enter':
                    sendMessage();
                    break;
                case 'space':
                    aiInput.value += ' ';
                    break;
                default:
                    aiInput.value += keyValue;
            }
            
            aiInput.focus();
        });
    });
}

// Отправка сообщения в DeepSeek
async function sendMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) {
        addSystemMessage('Ошибка: Введите сообщение');
        return;
    }
    
    if (!state.apiKey) {
        addSystemMessage('Ошибка: API ключ не настроен. Нажмите на шестерёнку');
        return;
    }
    
    // Добавляем сообщение пользователя
    addUserMessage(message);
    input.value = '';
    
    // Показываем индикатор загрузки
    const loadingId = addSystemMessage('DeepSeek: Обработка запроса...');
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Удаляем индикатор загрузки
        removeMessage(loadingId);
        
        // Добавляем ответ AI
        if (data.choices && data.choices[0]) {
            addAIMessage(data.choices[0].message.content);
        } else {
            addSystemMessage('Ошибка: Неожиданный формат ответа');
        }
        
    } catch (error) {
        removeMessage(loadingId);
        addSystemMessage(`Ошибка: ${error.message}`);
        console.error('API Error:', error);
    }
}

// Добавление системного сообщения
function addSystemMessage(text) {
    const id = 'msg_' + Date.now();
    const message = {
        id,
        type: 'system',
        text,
        timestamp: new Date()
    };
    
    state.messages.push(message);
    
    const output = document.getElementById('consoleOutput');
    const msgElement = document.createElement('div');
    msgElement.className = 'system-message';
    msgElement.id = id;
    msgElement.innerHTML = `<span class="prompt">></span> ${text}`;
    
    output.appendChild(msgElement);
    output.scrollTop = output.scrollHeight;
    
    return id;
}

// Добавление сообщения пользователя
function addUserMessage(text) {
    const id = 'msg_' + Date.now();
    const message = {
        id,
        type: 'user',
        text,
        timestamp: new Date()
    };
    
    state.messages.push(message);
    
    const output = document.getElementById('consoleOutput');
    const msgElement = document.createElement('div');
    msgElement.className = 'user-message';
    msgElement.id = id;
    msgElement.innerHTML = `<span class="prompt">></span> ${text}`;
    
    output.appendChild(msgElement);
    output.scrollTop = output.scrollHeight;
}

// Добавление сообщения AI
function addAIMessage(text) {
    const id = 'msg_' + Date.now();
    const message = {
        id,
        type: 'ai',
        text,
        timestamp: new Date()
    };
    
    state.messages.push(message);
    
    const output = document.getElementById('consoleOutput');
    const msgElement = document.createElement('div');
    msgElement.className = 'ai-message';
    msgElement.id = id;
    
    // Форматирование ответа
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    
    msgElement.innerHTML = `<span class="prompt">></span> ${formattedText}`;
    
    output.appendChild(msgElement);
    output.scrollTop = output.scrollHeight;
}

// Удаление сообщения
function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
    state.messages = state.messages.filter(msg => msg.id !== id);
}

// Очистка консоли
function clearConsole() {
    document.getElementById('consoleOutput').innerHTML = '';
    state.messages = [];
    addSystemMessage('Консоль очищена');
}

// Открытие настроек
function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('apiKey').value = state.apiKey;
}

// Закрытие настроек
function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Сохранение настроек
function saveSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const consoleColor = document.getElementById('consoleColor').value;
    const scanlinesEffect = document.getElementById('scanlinesEffect').checked;
    const blinkCursor = document.getElementById('blinkCursor').checked;
    const typeSound = document.getElementById('typeSound').checked;
    
    // Сохраняем API ключ
    state.apiKey = apiKey;
    localStorage.setItem('deepseek_api_key', apiKey);
    
    // Сохраняем цвет консоли
    localStorage.setItem('console_color', consoleColor);
    document.documentElement.style.setProperty('--turquoise', consoleColor);
    
    // Сохраняем эффекты
    localStorage.setItem('scanlines_effect', scanlinesEffect);
    localStorage.setItem('blink_cursor', blinkCursor);
    localStorage.setItem('type_sound', typeSound);
    
    // Применяем эффекты
    document.querySelector('.scanlines').style.display = scanlinesEffect ? 'block' : 'none';
    
    updateApiStatus();
    addSystemMessage('Настройки сохранены');
    closeSettings();
}

// Тестирование соединения с API
async function testApiConnection() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        alert('Введите API ключ для тестирования');
        return;
    }
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            alert('✅ Соединение с DeepSeek API успешно установлено!');
        } else {
            alert('❌ Ошибка соединения. Проверьте API ключ.');
        }
    } catch (error) {
        alert('❌ Ошибка сети: ' + error.message);
    }
}

// Показать/скрыть API ключ
function toggleKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleBtn = document.getElementById('toggleKeyVisibility');
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        apiKeyInput.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// Обновление статуса API
function updateApiStatus() {
    const statusElement = document.getElementById('apiStatus');
    
    if (state.apiKey) {
        // Показываем только первые и последние 4 символа ключа
        const maskedKey = state.apiKey.substring(0, 4) + 
                         '...' + 
                         state.apiKey.substring(state.apiKey.length - 4);
        
        statusElement.textContent = `НАСТРОЕН (${maskedKey})`;
        statusElement.className = 'success-text';
    } else {
        statusElement.textContent = 'НЕ НАСТРОЕН';
        statusElement.className = 'error-text';
    }
}

// Показать справку
function showHelp() {
    const helpMessage = `
<strong>КОМАНДЫ СИСТЕМЫ:</strong><br>
• Введите запрос и нажмите ENTER или кнопку "ОТПРАВИТЬ"<br>
• Настройте API ключ в настройках (шестерёнка)<br>
• Получите API ключ на platform.deepseek.com<br>
• Используйте ретро-клавиатуру для ввода<br>
• Очистите консоль при необходимости<br><br>
<strong>ПОДДЕРЖИВАЕМЫЕ ЗАПРОСЫ:</strong><br>
• Программирование<br>
• Математика<br>
• Анализ текста<br>
• Креативные задачи<br>
• И многое другое...
    `;
    
    addAIMessage(helpMessage);
}

// Воспроизведение звука клавиши
function playKeySound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800 + Math.random() * 400;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Аудио не поддерживается');
    }
}

// Автоматическое обновление курсора
setInterval(() => {
    const cursor = document.querySelector('.typing-cursor');
    if (cursor && document.getElementById('blinkCursor').checked) {
        cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
    }
}, 500);