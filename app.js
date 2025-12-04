// app.js - MIA AI Assistant Application Logic

// Application State
const AppState = {
    terminalLoaded: false,
    selectedPlan: null,
    userSubscribed: false,
    currentScreen: 'terminal',
    userAuthenticated: false,
    authMethod: null // 'google', 'telegram', или null
};

// DOM Elements
const elements = {
    terminalScreen: document.getElementById('terminalScreen'),
    terminalContent: document.getElementById('terminalContent'),
    mainApp: document.getElementById('mainApp'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsMenu: document.getElementById('settingsMenu'),
    closeSettingsMenu: document.getElementById('closeSettingsMenu'),
    subscribeBtn: document.getElementById('subscribeBtn'),
    subscriptionMenu: document.getElementById('subscriptionMenu'),
    closeSubscriptionMenu: document.getElementById('closeSubscriptionMenu'),
    supportBtn: document.getElementById('supportBtn'),
    supportMenu: document.getElementById('supportMenu'),
    planCards: document.querySelectorAll('.plan-card'),
    payButton: document.getElementById('payButton'),
    paymentMethods: document.getElementById('paymentMethods'),
    skipButton: document.getElementById('skipButton'),
    googleSignIn: document.getElementById('googleSignIn')
};

// Terminal Boot Sequence (English only)
const bootMessages = [
    "[SYSTEM] Initializing MIA AI Core...",
    "[OK] Loading neural network modules...",
    "[OK] Connecting to AI processors...",
    "[OK] Initializing voice recognition...",
    "[OK] Setting up memory cache...",
    "[OK] Establishing secure connection...",
    "[OK] Loading user interface...",
    "[SUCCESS] MIA AI Assistant ready",
    "[INFO] Terminal session complete"
];

class TerminalBoot {
    constructor() {
        this.messageIndex = 0;
        this.lineDelay = 200;
        this.charDelay = 30;
        this.bootTimeout = null;
        this.skipRequested = false;
    }

    async start() {
        // Показываем fallback сразу для предотвращения черного экрана
        this.showLoadingFallback();
        
        return new Promise((resolve) => {
            this.bootTimeout = setTimeout(() => {
                if (!this.skipRequested) {
                    this.showNextMessage(resolve);
                }
            }, 300); // Небольшая задержка перед началом анимации
        });
    }

    showLoadingFallback() {
        // Создаем fallback элемент на случай проблем с загрузкой
        const fallback = document.createElement('div');
        fallback.className = 'loading-fallback';
        fallback.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading MIA AI Assistant...</p>
        `;
        document.body.appendChild(fallback);
        
        // Убираем fallback когда приложение загрузится
        setTimeout(() => {
            if (fallback.parentNode) {
                fallback.style.opacity = '0';
                fallback.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (fallback.parentNode) {
                        fallback.remove();
                    }
                }, 500);
            }
        }, 2000);
    }

    showNextMessage(resolve) {
        if (this.messageIndex >= bootMessages.length || this.skipRequested) {
            this.hideLoadingFallback();
            setTimeout(() => {
                this.fadeOutTerminal();
                resolve();
            }, 700);
            return;
        }

        const message = bootMessages[this.messageIndex];
        this.typeMessage(message, () => {
            this.messageIndex++;
            setTimeout(() => this.showNextMessage(resolve), this.lineDelay);
        });
    }

    hideLoadingFallback() {
        const fallback = document.querySelector('.loading-fallback');
        if (fallback) {
            fallback.style.opacity = '0';
            setTimeout(() => {
                if (fallback.parentNode) {
                    fallback.remove();
                }
            }, 500);
        }
    }

    typeMessage(message, callback) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.style.animationDelay = `${this.messageIndex * 0.1}s`;
        elements.terminalContent.appendChild(line);

        let charIndex = 0;
        
        const typeChar = () => {
            if (charIndex < message.length) {
                line.textContent += message.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, this.charDelay);
            } else {
                callback();
            }
        };

        typeChar();
        
        // Scroll to bottom
        elements.terminalContent.scrollTop = elements.terminalContent.scrollHeight;
    }

    skipBootSequence() {
        this.skipRequested = true;
        this.hideLoadingFallback();
        
        // Очищаем таймаут если он есть
        if (this.bootTimeout) {
            clearTimeout(this.bootTimeout);
        }
        
        // Немедленно переходим к главному экрану
        this.fadeOutTerminal();
    }

    fadeOutTerminal() {
        elements.terminalScreen.classList.add('fade-out');
        setTimeout(() => {
            elements.terminalScreen.style.display = 'none';
            elements.mainApp.style.display = 'block';
            AppState.currentScreen = 'main';
            this.initializeMainApp();
        }, 500);
    }

    initializeMainApp() {
        // Проверяем авторизацию пользователя
        if (!AppState.userAuthenticated) {
            // Показываем Google Sign-In
            this.initializeGoogleSignIn();
        } else {
            // Если уже авторизован, показываем основной интерфейс
            this.showMainInterface();
        }
        
        // Add event listeners
        this.setupEventListeners();
    }

    initializeGoogleSignIn() {
        // Инициализация Google Sign-In
        if (window.google && window.google.accounts) {
            console.log('Google Sign-In API loaded successfully');
            
            // Обработчик успешной авторизации
            window.handleGoogleSignIn = (response) => {
                console.log('Google Sign-In response:', response);
                
                // Здесь нужно отправить credential на ваш бэкенд
                const credential = response.credential;
                
                // Симуляция успешной авторизации
                AppState.userAuthenticated = true;
                AppState.authMethod = 'google';
                
                // Скрываем Google Sign-In и показываем основной интерфейс
                elements.googleSignIn.style.display = 'none';
                this.showMainInterface();
                
                this.showNotification('Успешная авторизация через Google!');
            };
            
            // Обработчик ошибок
            window.handleGoogleError = (error) => {
                console.error('Google Sign-In error:', error);
                this.showNotification('Ошибка авторизации через Google. Попробуйте еще раз.');
            };
        } else {
            console.warn('Google Sign-In API not loaded, showing fallback');
            this.showNotification('Google Sign-In временно недоступен. Используйте вход через Telegram.');
        }
    }

    showMainInterface() {
        // Update subscribe button text based on subscription status
        if (AppState.userSubscribed) {
            elements.subscribeBtn.textContent = 'Продлить подписку';
        }
        
        // Показываем основной интерфейс
        document.querySelector('.main-content').style.display = 'flex';
        document.querySelector('.bottom-nav').style.display = 'flex';
    }

    setupEventListeners() {
        // Settings Menu
        elements.settingsBtn.addEventListener('click', this.openSettingsMenu.bind(this));
        elements.closeSettingsMenu.addEventListener('click', this.closeSettingsMenu.bind(this));
        
        // Subscription Menu
        elements.subscribeBtn.addEventListener('click', this.openSubscriptionMenu.bind(this));
        elements.closeSubscriptionMenu.addEventListener('click', this.closeSubscriptionMenu.bind(this));
        
        // Support Menu
        elements.supportBtn.addEventListener('click', this.toggleSupportMenu.bind(this));
        
        // Plan Selection
        elements.planCards.forEach(card => {
            card.addEventListener('click', () => this.selectPlan(card));
        });
        
        // Pay Button
        elements.payButton.addEventListener('click', this.showPaymentMethods.bind(this));
        
        // Payment Methods
        document.getElementById('sberPayment').addEventListener('click', (e) => {
            e.preventDefault();
            this.processPayment('sber');
        });
        
        document.getElementById('cardPayment').addEventListener('click', (e) => {
            e.preventDefault();
            this.processPayment('card');
        });
        
        document.getElementById('sbpPayment').addEventListener('click', (e) => {
            e.preventDefault();
            this.processPayment('sbp');
        });
        
        // Кнопка скипа анимации
        if (elements.skipButton) {
            elements.skipButton.addEventListener('click', () => {
                this.skipBootSequence();
            });
        }
        
        // Авторизация через Telegram
        const telegramAuthBtn = document.querySelector('.telegram-auth-btn');
        if (telegramAuthBtn) {
            telegramAuthBtn.addEventListener('click', (e) => {
                if (!telegramAuthBtn.href.includes('#')) {
                    e.preventDefault();
                    AppState.userAuthenticated = true;
                    AppState.authMethod = 'telegram';
                    elements.googleSignIn.style.display = 'none';
                    this.showMainInterface();
                    this.showNotification('Авторизация через Telegram успешна!');
                }
            });
        }
        
        // Menu Items
        document.getElementById('paymentItem').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPaymentManagement();
        });
        
        document.getElementById('transactionsItem').addEventListener('click', (e) => {
            e.preventDefault();
            this.showTransactions();
        });
        
        document.getElementById('referralItem').addEventListener('click', (e) => {
            e.preventDefault();
            this.showReferralProgram();
        });
        
        document.getElementById('supportItem').addEventListener('click', (e) => {
            e.preventDefault();
            this.openTelegramSupport();
        });
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.supportBtn.contains(e.target) && 
                !elements.supportMenu.contains(e.target) &&
                elements.supportMenu.style.display === 'flex') {
                this.closeSupportMenu();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllMenus();
            }
        });
        
        // Handle mobile gestures
        this.setupMobileGestures();
    }

    // ... остальные методы (openSettingsMenu, closeSettingsMenu и т.д.) остаются без изменений ...

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background: rgba(25, 25, 25, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px 20px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupMobileGestures() {
        // ... существующий код без изменений ...
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, не было ли уже загружено приложение
    if (!document.querySelector('.terminal-screen')) {
        console.error('Terminal screen not found!');
        return;
    }
    
    const app = new TerminalBoot();
    
    // Добавляем таймаут на случай полной загрузки
    const loadTimeout = setTimeout(() => {
        console.warn('Forcing app load after timeout');
        app.skipBootSequence();
    }, 10000); // 10 секунд максимум
    
    app.start().then(() => {
        clearTimeout(loadTimeout);
    }).catch((error) => {
        console.error('App initialization error:', error);
        clearTimeout(loadTimeout);
        app.skipBootSequence();
    });
    
    // Handle viewport height on mobile
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
});

// Экспорт для отладки
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, TerminalBoot };
}

// Глобальные обработчики для Google Sign-In
window.handleGoogleSignIn = (response) => {
    console.log('Google Sign-In successful:', response);
    // Здесь будет обработка ответа от Google
};

window.handleGoogleError = (error) => {
    console.error('Google Sign-In failed:', error);
};