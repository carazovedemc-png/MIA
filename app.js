// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.MainButton.hide();

// Состояние приложения
const appState = {
    theme: 'dark',
    settings: {
        assistantName: 'Мия',
        language: 'ru',
        voice: 'female',
        speechSpeed: 1.0,
        notificationVolume: 75,
        soundEffects: true,
        aiProvider: 'deepseek',
        apiKey: '',
        contextMemory: true,
        learningEnabled: true,
        biometricAuth: false,
        autoDeleteHistory: true,
        dataEncryption: true
    },
    messages: [],
    stats: {
        messageCount: 127,
        activeDays: 14,
        memoryUsage: 85
    }
};

// Элементы DOM
const elements = {
    // Навигация
    sideMenu: document.getElementById('sideMenu'),
    menuToggle: document.getElementById('menuToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    
    // Аватары
    menuAvatar: document.getElementById('menuAvatar'),
    mainAvatar: document.getElementById('mainAvatar'),
    
    // Главная страница
    userName: document.getElementById('userName'),
    messagesCount: document.getElementById('messagesCount'),
    activeDays: document.getElementById('activeDays'),
    memoryUsage: document.getElementById('memoryUsage'),
    
    // Быстрые действия
    voiceAction: document.getElementById('voiceAction'),
    notesAction: document.getElementById('notesAction'),
    reminderAction: document.getElementById('reminderAction'),
    weatherAction: document.getElementById('weatherAction'),
    musicAction: document.getElementById('musicAction'),
    arAction: document.getElementById('arAction'),
    
    // Чат
    messagesContainer: document.getElementById('messagesContainer'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    voiceInputBtn: document.getElementById('voiceInputBtn'),
    
    // Настройки
    assistantName: document.getElementById('assistantName'),
    languageSelect: document.getElementById('languageSelect'),
    voiceSelect: document.getElementById('voiceSelect'),
    speechSpeed: document.getElementById('speechSpeed'),
    speedValue: document.getElementById('speedValue'),
    notificationVolume: document.getElementById('notificationVolume'),
    volumeValue: document.getElementById('volumeValue'),
    soundEffects: document.getElementById('soundEffects'),
    aiProvider: document.getElementById('aiProvider'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeyContainer: document.getElementById('apiKeyContainer'),
    showKeyBtn: document.getElementById('showKeyBtn'),
    contextMemory: document.getElementById('contextMemory'),
    learningEnabled: document.getElementById('learningEnabled'),
    biometricAuth: document.getElementById('biometricAuth'),
    autoDeleteHistory: document.getElementById('autoDeleteHistory'),
    dataEncryption: document.getElementById('dataEncryption'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    themeOptions: document.querySelectorAll('.theme-option'),
    
    // Модальные окна
    voiceModal: document.getElementById('voiceModal'),
    themeToggle: document.getElementById('themeToggle'),
    
    // Тема
    htmlElement: document.documentElement
};

// Инициализация приложения
function initApp() {
    loadState();
    updateUI();
    setupEventListeners();
    loadMessages();
    updateStats();
    
    // Установить начальную страницу
    navigateTo('main');
    
    // Отправить данные в Telegram
    tg.sendData(JSON.stringify({
        action: 'init',
        theme: appState.theme
    }));
}

// Загрузка состояния из localStorage
function loadState() {
    const savedState = localStorage.getItem('miaAppState');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            Object.assign(appState, parsed);
        } catch (e) {
            console.error('Ошибка загрузки состояния:', e);
        }
    }
    
    // Загрузить настройки в UI
    elements.assistantName.value = appState.settings.assistantName;
    elements.languageSelect.value = appState.settings.language;
    elements.voiceSelect.value = appState.settings.voice;
    elements.speechSpeed.value = appState.settings.speechSpeed;
    elements.notificationVolume.value = appState.settings.notificationVolume;
    elements.soundEffects.checked = appState.settings.soundEffects;
    elements.aiProvider.value = appState.settings.aiProvider;
    elements.apiKeyInput.value = appState.settings.apiKey;
    elements.contextMemory.checked = appState.settings.contextMemory;
    elements.learningEnabled.checked = appState.settings.learningEnabled;
    elements.biometricAuth.checked = appState.settings.biometricAuth;
    elements.autoDeleteHistory.checked = appState.settings.autoDeleteHistory;
    elements.dataEncryption.checked = appState.settings.dataEncryption;
    
    // Обновить значения слайдеров
    updateSliderValues();
}

// Сохранение состояния в localStorage
function saveState() {
    try {
        localStorage.setItem('miaAppState', JSON.stringify(appState));
        
        // Отправить данные в Telegram
        tg.sendData(JSON.stringify({
            action: 'settingsUpdated',
            settings: appState.settings
        }));
    } catch (e) {
        console.error('Ошибка сохранения состояния:', e);
    }
}

// Обновление UI
function updateUI() {
    // Обновить тему
    elements.htmlElement.setAttribute('data-theme', appState.theme);
    
    // Обновить иконку темы
    const themeIcon = elements.themeToggle.querySelector('i');
    themeIcon.className = appState.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    // Обновить имя ассистента
    elements.userName.textContent = appState.settings.assistantName;
    
    // Обновить выбранную тему
    elements.themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === appState.theme) {
            option.classList.add('active');
        }
    });
    
    // Показать/скрыть поле API ключа
    toggleApiKeyField();
}

// Обновление статистики
function updateStats() {
    elements.messagesCount.textContent = appState.stats.messageCount;
    elements.activeDays.textContent = appState.stats.activeDays;
    elements.memoryUsage.textContent = appState.stats.memoryUsage + '%';
}

// Обновление значений слайдеров
function updateSliderValues() {
    elements.speedValue.textContent = getSpeedLabel(appState.settings.speechSpeed);
    elements.volumeValue.textContent = appState.settings.notificationVolume + '%';
}

function getSpeedLabel(speed) {
    if (speed < 0.8) return `Медленная (${speed}x)`;
    if (speed > 1.2) return `Быстрая (${speed}x)`;
    return `Средняя (${speed}x)`;
}

// Переключение темы
function toggleTheme() {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    updateUI();
    saveState();
}

// Навигация по страницам
function navigateTo(pageId) {
    // Скрыть все страницы
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Убрать активный класс со всех пунктов меню
    elements.navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Показать выбранную страницу
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Активировать пункт меню
    const targetNavItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
    
    // Обновить заголовок
    updatePageTitle(pageId);
    
    // Закрыть меню на мобильных
    if (window.innerWidth <= 1024) {
        elements.sideMenu.classList.remove('active');
    }
}

function updatePageTitle(pageId) {
    const titles = {
        main: { title: 'Главная', subtitle: 'Персональный ассистент' },
        chat: { title: 'Чат с Мией', subtitle: 'Общение с ассистентом' },
        settings: { title: 'Настройки', subtitle: 'Настройки приложения' },
        memory: { title: 'Память', subtitle: 'Управление данными' },
        help: { title: 'Помощь', subtitle: 'Справка и поддержка' }
    };
    
    const pageInfo = titles[pageId] || { title: 'Мия Ассистент', subtitle: '' };
    elements.pageTitle.textContent = pageInfo.title;
    elements.pageSubtitle.textContent = pageInfo.subtitle;
}

// Загрузка сообщений
function loadMessages() {
    const messages = [
        { text: "Привет! Я Мия, ваш персональный ассистент. Чем могу помочь?", time: "10:00", isUser: false },
        { text: "Привет! Какая сегодня погода?", time: "10:01", isUser: true },
        { text: "Сегодня солнечно, +22°C. Идеальная погода для прогулки!", time: "10:01", isUser: false },
        { text: "Спасибо! Напомни мне о встрече в 15:00", time: "10:02", isUser: true },
        { text: "Конечно! Напоминание установлено на 15:00. Я напомню вам за 30 минут.", time: "10:02", isUser: false }
    ];
    
    messages.forEach(msg => addMessageToChat(msg.text, msg.time, msg.isUser));
}

// Добавление сообщения в чат
function addMessageToChat(text, time, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'sent' : 'received'}`;
    
    messageDiv.innerHTML = `
        <div class="message-text">${text}</div>
        <div class="message-time">${time}</div>
    `;
    
    elements.messagesContainer.appendChild(messageDiv);
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    
    // Обновить статистику
    if (isUser) {
        appState.stats.messageCount++;
        elements.messagesCount.textContent = appState.stats.messageCount;
        saveState();
    }
}

// Отправка сообщения
function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addMessageToChat(text, time, true);
    
    elements.messageInput.value = '';
    
    // Имитация ответа ассистента
    simulateAIResponse(text);
}

// Имитация ответа AI
function simulateAIResponse(userMessage) {
    setTimeout(() => {
        const responses = [
            "Я поняла ваш запрос. Обрабатываю информацию...",
            "Интересный вопрос! Давайте разберемся вместе.",
            "Спасибо за вопрос. Вот что я могу сказать по этой теме...",
            "Отличный вопрос! Мой ответ:",
            "Поняла. Давайте обсудим это подробнее."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Определить эмоцию по сообщению
        const emotion = detectEmotion(userMessage);
        updateAvatarEmotion(emotion);
        
        addMessageToChat(`${randomResponse} ${userMessage}`, time, false);
        
        // Воспроизвести звук уведомления
        if (appState.settings.soundEffects) {
            playNotificationSound();
        }
        
    }, 1000 + Math.random() * 2000);
}

// Определение эмоции по тексту
function detectEmotion(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('спасибо') || lowerText.includes('хорошо') || lowerText.includes('отлично')) {
        return 'happy';
    } else if (lowerText.includes('?') || lowerText.includes('почему') || lowerText.includes('как')) {
        return 'thinking';
    } else if (lowerText.includes('грустно') || lowerText.includes('плохо') || lowerText.includes('устал')) {
        return 'sad';
    } else if (lowerText.includes('злой') || lowerText.includes('сердит') || lowerText.includes('бесит')) {
        return 'angry';
    } else if (lowerText.includes('вау') || lowerText.includes('ура') || lowerText.includes('круто')) {
        return 'excited';
    }
    
    return 'neutral';
}

// Обновление эмоции аватара
function updateAvatarEmotion(emotion) {
    const emojiMap = {
        happy: '😊',
        thinking: '🤔',
        sad: '😢',
        angry: '😠',
        excited: '🎉',
        neutral: '👩'
    };
    
    const emoji = emojiMap[emotion] || '👩';
    
    // Анимация смены эмоции
    elements.mainAvatar.style.transform = 'scale(1.2)';
    setTimeout(() => {
        elements.mainAvatar.textContent = emoji;
        elements.mainAvatar.style.transform = 'scale(1)';
    }, 200);
    
    // Обновить аватар в меню
    elements.menuAvatar.textContent = emoji;
}

// Воспроизведение звука уведомления
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.volume = appState.settings.notificationVolume / 100;
    audio.play().catch(e => console.log('Ошибка воспроизведения звука:', e));
}

// Голосовой ввод
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Голосовой ввод не поддерживается в вашем браузере');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = appState.settings.language === 'ru' ? 'ru-RU' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    // Показать модальное окно
    elements.voiceModal.classList.add('active');
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.messageInput.value = transcript;
        
        // Скрыть модальное окно
        setTimeout(() => {
            elements.voiceModal.classList.remove('active');
        }, 500);
    };
    
    recognition.onerror = (event) => {
        console.error('Ошибка распознавания речи:', event.error);
        elements.voiceModal.classList.remove('active');
    };
    
    recognition.onend = () => {
        elements.voiceModal.classList.remove('active');
    };
}

// Быстрые действия
function handleQuickAction(action) {
    const actions = {
        voice: () => {
            showToast('Запуск голосового ассистента');
            startVoiceInput();
        },
        notes: () => {
            showToast('Открытие заметок');
            // Реализация заметок
        },
        reminder: () => {
            showToast('Создание напоминания');
            // Реализация напоминаний
        },
        weather: () => {
            showToast('Получение данных о погоде');
            // Получение погоды
        },
        music: () => {
            showToast('Запуск музыкального плеера');
            // Музыкальный плеер
        },
        ar: () => {
            showToast('Включение AR режима');
            // AR режим
        }
    };
    
    if (actions[action]) {
        actions[action]();
    }
}

// Показать уведомление
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Анимация появления
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Сохранение настроек
function saveSettings() {
    appState.settings.assistantName = elements.assistantName.value;
    appState.settings.language = elements.languageSelect.value;
    appState.settings.voice = elements.voiceSelect.value;
    appState.settings.speechSpeed = parseFloat(elements.speechSpeed.value);
    appState.settings.notificationVolume = parseInt(elements.notificationVolume.value);
    appState.settings.soundEffects = elements.soundEffects.checked;
    appState.settings.aiProvider = elements.aiProvider.value;
    appState.settings.apiKey = elements.apiKeyInput.value;
    appState.settings.contextMemory = elements.contextMemory.checked;
    appState.settings.learningEnabled = elements.learningEnabled.checked;
    appState.settings.biometricAuth = elements.biometricAuth.checked;
    appState.settings.autoDeleteHistory = elements.autoDeleteHistory.checked;
    appState.settings.dataEncryption = elements.dataEncryption.checked;
    
    saveState();
    showToast('Настройки сохранены успешно!', 'success');
    
    // Обновить UI
    updateUI();
}

// Сброс настроек
function resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
        appState.settings = {
            assistantName: 'Мия',
            language: 'ru',
            voice: 'female',
            speechSpeed: 1.0,
            notificationVolume: 75,
            soundEffects: true,
            aiProvider: 'deepseek',
            apiKey: '',
            contextMemory: true,
            learningEnabled: true,
            biometricAuth: false,
            autoDeleteHistory: true,
            dataEncryption: true
        };
        
        // Обновить UI
        loadState();
        updateUI();
        showToast('Настройки сброшены', 'info');
    }
}

// Очистка данных
function clearData() {
    if (confirm('ВНИМАНИЕ: Это действие удалит все ваши данные, включая историю чатов и настройки. Продолжить?')) {
        localStorage.clear();
        appState.messages = [];
        appState.stats = {
            messageCount: 0,
            activeDays: 1,
            memoryUsage: 10
        };
        
        // Очистить чат
        elements.messagesContainer.innerHTML = '';
        
        // Загрузить начальные сообщения
        loadMessages();
        
        // Обновить статистику
        updateStats();
        
        showToast('Все данные очищены', 'warning');
    }
}

// Показать/скрыть API ключ
function toggleApiKeyVisibility() {
    const type = elements.apiKeyInput.type;
    elements.apiKeyInput.type = type === 'password' ? 'text' : 'password';
    elements.showKeyBtn.querySelector('i').className = type === 'password' ? 'fas fa-eye-slash' : 'fas fa-eye';
}

// Показать/скрыть поле API ключа в зависимости от провайдера
function toggleApiKeyField() {
    const provider = elements.aiProvider.value;
    if (provider === 'offline') {
        elements.apiKeyContainer.style.display = 'none';
    } else {
        elements.apiKeyContainer.style.display = 'flex';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация
    elements.menuToggle.addEventListener('click', () => {
        elements.sideMenu.classList.toggle('active');
    });
    
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Тема
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    elements.themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            appState.theme = option.dataset.theme;
            updateUI();
            saveState();
        });
    });
    
    // Быстрые действия
    elements.voiceAction.addEventListener('click', () => handleQuickAction('voice'));
    elements.notesAction.addEventListener('click', () => handleQuickAction('notes'));
    elements.reminderAction.addEventListener('click', () => handleQuickAction('reminder'));
    elements.weatherAction.addEventListener('click', () => handleQuickAction('weather'));
    elements.musicAction.addEventListener('click', () => handleQuickAction('music'));
    elements.arAction.addEventListener('click', () => handleQuickAction('ar'));
    
    // Чат
    elements.sendMessageBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    elements.voiceInputBtn.addEventListener('click', startVoiceInput);
    
    // Настройки
    elements.speechSpeed.addEventListener('input', () => {
        elements.speedValue.textContent = getSpeedLabel(elements.speechSpeed.value);
    });
    
    elements.notificationVolume.addEventListener('input', () => {
        elements.volumeValue.textContent = elements.notificationVolume.value + '%';
    });
    
    elements.aiProvider.addEventListener('change', toggleApiKeyField);
    elements.showKeyBtn.addEventListener('click', toggleApiKeyVisibility);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    elements.clearDataBtn.addEventListener('click', clearData);
    
    // Модальные окна
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Закрытие модальных окон по клику вне
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Обработка сообщений от Telegram
    tg.onEvent('viewportChanged', () => {
        tg.expand();
    });
    
    tg.onEvent('themeChanged', () => {
        appState.theme = tg.colorScheme;
        updateUI();
    });
    
    // Обработка закрытия приложения
    window.addEventListener('beforeunload', () => {
        saveState();
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Экспорт для отладки
window.MiaApp = {
    state: appState,
    saveState,
    resetSettings,
    clearData
};