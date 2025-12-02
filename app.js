// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
const state = {
    theme: 'dark',
    voice: 'female',
    emotion: '😊',
    sound: true,
    messages: []
};

// Элементы DOM
const elements = {
    avatarEmoji: document.getElementById('avatarEmoji'),
    chatContainer: document.getElementById('chatContainer'),
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    voiceBtn: document.getElementById('voiceBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    clearBtn: document.getElementById('clearBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    themeSelect: document.getElementById('themeSelect'),
    voiceSelect: document.getElementById('voiceSelect'),
    soundToggle: document.getElementById('soundToggle'),
    closeSettings: document.getElementById('closeSettings')
};

// Инициализация
function init() {
    loadState();
    applyTheme();
    setupEventListeners();
    addWelcomeMessage();
    
    // Отправка по Enter
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Загрузка состояния из localStorage
function loadState() {
    const saved = localStorage.getItem('miaState');
    if (saved) {
        Object.assign(state, JSON.parse(saved));
        elements.themeSelect.value = state.theme;
        elements.voiceSelect.value = state.voice;
        elements.soundToggle.checked = state.sound;
        elements.avatarEmoji.textContent = state.emotion;
    }
}

// Сохранение состояния
function saveState() {
    localStorage.setItem('miaState', JSON.stringify(state));
}

// Применение темы
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

// Добавление сообщения в чат
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const time = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    elements.chatContainer.appendChild(messageDiv);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    
    if (!isUser) {
        animateEmotion(text);
        if (state.sound) playNotification();
    }
    
    saveState();
}

// Отправка сообщения
function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    elements.messageInput.value = '';
    
    // Имитация ответа ассистента
    setTimeout(() => {
        const responses = [
            "Интересный вопрос! Давайте подумаем вместе.",
            "Я поняла ваш запрос. Сейчас обработаю информацию.",
            "Отличный вопрос! Вот что я нашла по этой теме...",
            "Да, я могу помочь с этим. Мой ответ:",
            "Спасибо за вопрос! Это действительно важная тема."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(`${randomResponse} Ваш запрос: "${text}"`);
    }, 1000 + Math.random() * 2000);
}

// Анимация эмоций
function animateEmotion(text) {
    const emotions = {
        'привет': '👋',
        'спасибо': '😊',
        'помощь': '🤔',
        'груст': '😢',
        'смех': '😂',
        'злой': '😠',
        '?': '🤔',
        '!': '😮'
    };
    
    for (const [keyword, emoji] of Object.entries(emotions)) {
        if (text.toLowerCase().includes(keyword)) {
            elements.avatarEmoji.textContent = emoji;
            state.emotion = emoji;
            
            // Возврат к стандартной эмоции через 3 секунды
            setTimeout(() => {
                elements.avatarEmoji.textContent = '😊';
                state.emotion = '😊';
            }, 3000);
            break;
        }
    }
    
    saveState();
}

// Воспроизведение звука
function playNotification() {
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// Голосовой ввод (заглушка)
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        addMessage("Голосовой ввод не поддерживается в вашем браузере");
        return;
    }
    
    addMessage("🎤 Слушаю...", true);
    
    // Здесь будет реальная реализация через Web Speech API
    setTimeout(() => {
        const phrases = [
            "Привет как дела",
            "Какая сегодня погода",
            "Расскажи анекдот",
            "Включи музыку",
            "Сколько время"
        ];
        
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        addMessage(`🎤 Вы сказали: "${randomPhrase}"`, true);
        
        setTimeout(() => {
            addMessage(`Я поняла: "${randomPhphrase}". Хороший вопрос!`);
        }, 1000);
    }, 2000);
}

// Очистка чата
function clearChat() {
    if (confirm("Очистить всю историю чата?")) {
        elements.chatContainer.innerHTML = '';
        addWelcomeMessage();
        saveState();
    }
}

// Приветственное сообщение
function addWelcomeMessage() {
    elements.chatContainer.innerHTML = `
        <div class="message assistant">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">Привет! Я Мия - ваш персональный помощник. Чем могу помочь?</div>
                <div class="message-time">только что</div>
            </div>
        </div>
    `;
}

// Настройки
function setupEventListeners() {
    // Отправка сообщения
    elements.sendButton.addEventListener('click', sendMessage);
    
    // Голосовой ввод
    elements.voiceBtn.addEventListener('click', startVoiceInput);
    
    // Очистка чата
    elements.clearBtn.addEventListener('click', clearChat);
    
    // Открытие настроек
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsOverlay.style.display = 'flex';
    });
    
    // Закрытие настроек
    elements.closeSettings.addEventListener('click', () => {
        elements.settingsOverlay.style.display = 'none';
    });
    
    // Изменение темы
    elements.themeSelect.addEventListener('change', (e) => {
        state.theme = e.target.value;
        applyTheme();
        saveState();
    });
    
    // Изменение голоса
    elements.voiceSelect.addEventListener('change', (e) => {
        state.voice = e.target.value;
        saveState();
    });
    
    // Переключение звука
    elements.soundToggle.addEventListener('change', (e) => {
        state.sound = e.target.checked;
        saveState();
    });
    
    // Кнопки эмоций
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const emoji = e.target.dataset.emoji;
            elements.avatarEmoji.textContent = emoji;
            state.emotion = emoji;
            saveState();
        });
    });
    
    // Закрытие по клику вне настроек
    elements.settingsOverlay.addEventListener('click', (e) => {
        if (e.target === elements.settingsOverlay) {
            elements.settingsOverlay.style.display = 'none';
        }
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);

// Telegram кнопка меню
tg.MainButton.setText('Открыть настройки').show();
tg.MainButton.onClick(() => {
    elements.settingsOverlay.style.display = 'flex';
});