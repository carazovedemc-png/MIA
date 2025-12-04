// app.js - MIA AI Assistant Application Logic

// Application State
const AppState = {
    terminalLoaded: false,
    selectedPlan: null,
    userSubscribed: false,
    userLoggedIn: false,
    currentScreen: 'terminal'
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
    authButton: document.getElementById('authButton'),
    socialAuthButtons: document.getElementById('socialAuthButtons'),
    googleAuth: document.getElementById('googleAuth'),
    telegramAuth: document.getElementById('telegramAuth'),
    miaAuth: document.getElementById('miaAuth'),
    vkAuth: document.getElementById('vkAuth')
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
        this.lineDelay = 120;
        this.charDelay = 15;
        this.isTerminating = false;
    }

    async start() {
        console.log("Terminal boot starting...");
        
        // Гарантируем что терминал виден
        elements.terminalScreen.style.display = 'flex';
        elements.terminalScreen.style.opacity = '1';
        elements.terminalScreen.style.zIndex = '1000';
        
        // Гарантируем что main-app скрыт
        elements.mainApp.style.display = 'none';
        
        // Начинаем последовательность
        await this.showNextMessage();
    }

    showNextMessage() {
        return new Promise((resolve) => {
            if (this.messageIndex >= bootMessages.length) {
                console.log("All messages shown, starting fade out");
                this.fadeOutTerminal();
                resolve();
                return;
            }

            const message = bootMessages[this.messageIndex];
            console.log(`Showing message ${this.messageIndex}: ${message}`);
            
            this.typeMessage(message, () => {
                this.messageIndex++;
                setTimeout(() => {
                    this.showNextMessage().then(resolve);
                }, this.lineDelay);
            });
        });
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
                // Прокрутка к низу
                elements.terminalContent.scrollTop = elements.terminalContent.scrollHeight;
                callback();
            }
        };

        typeChar();
    }

    fadeOutTerminal() {
        console.log("Starting terminal fade out");
        
        if (this.isTerminating) return;
        this.isTerminating = true;
        
        // Добавляем класс для анимации исчезновения
        elements.terminalScreen.classList.add('fade-out');
        
        // Ждем окончания анимации
        setTimeout(() => {
            console.log("Hiding terminal and showing main app");
            
            // Скрываем терминал
            elements.terminalScreen.style.display = 'none';
            
            // Показываем главное приложение
            elements.mainApp.style.display = 'block';
            elements.mainApp.classList.add('active');
            
            // Обновляем состояние
            AppState.currentScreen = 'main';
            
            // Инициализируем главное приложение
            this.initializeMainApp();
            
            console.log("Main app should be visible now");
        }, 700);
    }

    initializeMainApp() {
        console.log("Initializing main application");
        
        // Обновляем текст кнопки подписки
        if (AppState.userSubscribed) {
            elements.subscribeBtn.textContent = 'Продлить подписку';
        }
        
        // Добавляем обработчики событий
        this.setupEventListeners();
        
        // Инициализируем анимации
        this.startBackgroundAnimation();
    }

    setupEventListeners() {
        console.log("Setting up event listeners");
        
        // Settings Menu
        elements.settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openSettingsMenu();
        });
        
        elements.closeSettingsMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeSettingsMenu();
        });
        
        // Subscription Menu
        elements.subscribeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openSubscriptionMenu(e);
        });
        
        elements.closeSubscriptionMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeSubscriptionMenu();
        });
        
        // Support Menu
        elements.supportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSupportMenu();
        });
        
        // Plan Selection
        elements.planCards.forEach(card => {
            card.addEventListener('click', () => this.selectPlan(card));
        });
        
        // Pay Button
        elements.payButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPaymentMethods();
        });
        
        // Payment Methods
        document.getElementById('sberPayment')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.processPayment('sber');
        });
        
        document.getElementById('cardPayment')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.processPayment('card');
        });
        
        document.getElementById('sbpPayment')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.processPayment('sbp');
        });
        
        // Auth Button
        elements.authButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAuthButtons();
        });
        
        // Social Auth Buttons
        elements.googleAuth?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSocialAuth('google');
        });
        
        elements.telegramAuth?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSocialAuth('telegram');
        });
        
        elements.miaAuth?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSocialAuth('mia');
        });
        
        elements.vkAuth?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSocialAuth('vk');
        });
        
        // Menu Items
        document.getElementById('paymentItem')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showPaymentManagement();
        });
        
        document.getElementById('transactionsItem')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showTransactions();
        });
        
        document.getElementById('referralItem')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showReferralProgram();
        });
        
        document.getElementById('supportItem')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openTelegramSupport();
        });
        
        // Закрытие меню при клике снаружи
        document.addEventListener('click', (e) => {
            if (elements.settingsMenu && elements.settingsMenu.style.display === 'flex') {
                if (!elements.settingsMenu.contains(e.target) && 
                    !elements.settingsBtn.contains(e.target) &&
                    !elements.closeSettingsMenu.contains(e.target)) {
                    this.closeSettingsMenu();
                }
            }
            
            if (elements.supportMenu && elements.supportMenu.style.display === 'flex') {
                if (!elements.supportMenu.contains(e.target) && 
                    !elements.supportBtn.contains(e.target)) {
                    this.closeSupportMenu();
                }
            }
            
            if (elements.subscriptionMenu && elements.subscriptionMenu.style.display === 'flex') {
                if (!elements.subscriptionMenu.contains(e.target) && 
                    !elements.subscribeBtn.contains(e.target) &&
                    !elements.closeSubscriptionMenu.contains(e.target)) {
                    this.closeSubscriptionMenu();
                }
            }
        });
        
        // Обработка клавиши Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllMenus();
            }
        });
        
        // Обработка жестов на мобильных устройствах
        this.setupMobileGestures();
    }

    openSettingsMenu() {
        console.log("Opening settings menu");
        elements.settingsMenu.style.display = 'flex';
        setTimeout(() => {
            elements.settingsMenu.classList.remove('closing');
        }, 10);
    }

    closeSettingsMenu() {
        console.log("Closing settings menu");
        elements.settingsMenu.classList.add('closing');
        setTimeout(() => {
            elements.settingsMenu.style.display = 'none';
            elements.settingsMenu.classList.remove('closing');
            this.resetAuthButtons();
        }, 300);
    }

    openSubscriptionMenu(e) {
        console.log("Opening subscription menu");
        elements.subscriptionMenu.style.display = 'flex';
        setTimeout(() => {
            elements.subscriptionMenu.classList.remove('closing');
        }, 10);
    }

    closeSubscriptionMenu() {
        console.log("Closing subscription menu");
        elements.subscriptionMenu.classList.add('closing');
        setTimeout(() => {
            elements.subscriptionMenu.style.display = 'none';
            elements.subscriptionMenu.classList.remove('closing');
            if (elements.paymentMethods) elements.paymentMethods.style.display = 'none';
            if (elements.payButton) elements.payButton.style.display = 'block';
            this.resetPlanSelection();
        }, 300);
    }

    toggleSupportMenu() {
        if (elements.supportMenu.style.display === 'flex') {
            this.closeSupportMenu();
        } else {
            this.openSupportMenu();
        }
    }

    openSupportMenu() {
        console.log("Opening support menu");
        elements.supportMenu.style.display = 'flex';
        setTimeout(() => {
            elements.supportMenu.classList.remove('closing');
        }, 10);
    }

    closeSupportMenu() {
        console.log("Closing support menu");
        elements.supportMenu.classList.add('closing');
        setTimeout(() => {
            elements.supportMenu.style.display = 'none';
            elements.supportMenu.classList.remove('closing');
        }, 300);
    }

    closeAllMenus() {
        if (elements.settingsMenu && elements.settingsMenu.style.display === 'flex') {
            this.closeSettingsMenu();
        }
        if (elements.subscriptionMenu && elements.subscriptionMenu.style.display === 'flex') {
            this.closeSubscriptionMenu();
        }
        if (elements.supportMenu && elements.supportMenu.style.display === 'flex') {
            this.closeSupportMenu();
        }
    }

    toggleAuthButtons() {
        if (!elements.socialAuthButtons || !elements.authButton) return;
        
        if (elements.socialAuthButtons.style.display === 'none' || 
            elements.socialAuthButtons.style.display === '') {
            this.showSocialAuthButtons();
        } else {
            this.hideSocialAuthButtons();
        }
    }

    showSocialAuthButtons() {
        if (!elements.socialAuthButtons || !elements.authButton) return;
        
        elements.authButton.style.opacity = '0';
        elements.authButton.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            elements.authButton.style.display = 'none';
            elements.socialAuthButtons.style.display = 'grid';
            
            setTimeout(() => {
                elements.socialAuthButtons.style.opacity = '0';
                elements.socialAuthButtons.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    elements.socialAuthButtons.style.opacity = '1';
                    elements.socialAuthButtons.style.transform = 'translateY(0)';
                    elements.socialAuthButtons.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    
                    const buttons = elements.socialAuthButtons.children;
                    Array.from(buttons).forEach((button, index) => {
                        button.style.opacity = '0';
                        button.style.transform = 'scale(0.8)';
                        
                        setTimeout(() => {
                            button.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                            button.style.opacity = '1';
                            button.style.transform = 'scale(1)';
                        }, index * 100);
                    });
                }, 50);
            }, 10);
        }, 200);
    }

    hideSocialAuthButtons() {
        if (!elements.socialAuthButtons || !elements.authButton) return;
        
        const buttons = elements.socialAuthButtons.children;
        Array.from(buttons).forEach((button, index) => {
            setTimeout(() => {
                button.style.opacity = '0';
                button.style.transform = 'scale(0.8)';
            }, index * 50);
        });
        
        setTimeout(() => {
            elements.socialAuthButtons.style.display = 'none';
            elements.authButton.style.display = 'flex';
            
            setTimeout(() => {
                elements.authButton.style.opacity = '1';
                elements.authButton.style.transform = 'translateY(0)';
                elements.authButton.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            }, 50);
        }, 300);
    }

    resetAuthButtons() {
        if (!elements.socialAuthButtons || !elements.authButton) return;
        
        elements.authButton.style.display = 'flex';
        elements.authButton.style.opacity = '1';
        elements.authButton.style.transform = 'translateY(0)';
        elements.authButton.style.transition = '';
        
        elements.socialAuthButtons.style.display = 'none';
        elements.socialAuthButtons.style.opacity = '1';
        elements.socialAuthButtons.style.transform = 'translateY(0)';
        elements.socialAuthButtons.style.transition = '';
        
        const buttons = elements.socialAuthButtons.children;
        Array.from(buttons).forEach(button => {
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            button.style.transition = '';
        });
    }

    handleSocialAuth(provider) {
        console.log(`Social auth with ${provider}`);
        this.showNotification(`Авторизация через ${provider} будет реализована позже`);
        
        setTimeout(() => {
            AppState.userLoggedIn = true;
            this.showNotification('Успешная авторизация!');
            this.hideSocialAuthButtons();
            
            if (elements.authButton) {
                elements.authButton.innerHTML = `
                    <div class="auth-main-text">Профиль</div>
                    <div class="auth-sub-text">Вы вошли в систему</div>
                `;
                elements.authButton.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
            }
        }, 1000);
    }

    selectPlan(card) {
        elements.planCards.forEach(c => {
            c.classList.remove('selected');
            c.style.transform = '';
        });
        
        card.classList.add('selected');
        card.style.transform = 'scale(1.08)';
        
        AppState.selectedPlan = {
            plan: card.dataset.plan,
            price: card.dataset.price,
            duration: card.querySelector('.plan-duration').textContent
        };
    }

    resetPlanSelection() {
        elements.planCards.forEach(card => {
            card.classList.remove('selected');
            card.style.transform = '';
        });
        AppState.selectedPlan = null;
    }

    showPaymentMethods() {
        if (!AppState.selectedPlan) {
            this.showNotification('Пожалуйста, сначала выберите план подписки');
            return;
        }
        
        if (elements.payButton) elements.payButton.style.display = 'none';
        if (elements.paymentMethods) {
            elements.paymentMethods.style.display = 'flex';
            
            const methods = elements.paymentMethods.children;
            Array.from(methods).forEach((method, index) => {
                method.style.opacity = '0';
                method.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    method.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    method.style.opacity = '1';
                    method.style.transform = 'translateX(0)';
                }, index * 100);
            });
        }
    }

    processPayment(method) {
        if (!AppState.selectedPlan) return;
        
        console.log('Processing payment with method:', method);
        this.showPaymentProcessing(method);
    }

    showPaymentProcessing(method) {
        let message = '';
        
        switch(method) {
            case 'sber':
                message = 'Перенаправление в СберБанк Онлайн...';
                break;
            case 'card':
                message = 'Открытие формы оплаты картой...';
                break;
            case 'sbp':
                message = 'Генерация QR-кода для СБП...';
                break;
        }
        
        this.showNotification(message);
        
        setTimeout(() => {
            this.showNotification('Оплата успешна! Подписка активирована.');
            AppState.userSubscribed = true;
            if (elements.subscribeBtn) elements.subscribeBtn.textContent = 'Продлить подписку';
            this.closeSubscriptionMenu();
        }, 2000);
    }

    showPaymentManagement() {
        this.showNotification('Система управления оплатой откроется здесь');
    }

    showTransactions() {
        this.showNotification('История транзакций будет отображена здесь');
    }

    showReferralProgram() {
        this.showNotification('Интерфейс реферальной программы откроется здесь');
    }

    openTelegramSupport() {
        window.open('https://t.me/EDEM_CR', '_blank');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background: rgba(25, 25, 25, 0.98);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            padding: 14px 24px;
            color: white;
            font-size: 15px;
            font-weight: 600;
            z-index: 10000;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
            max-width: 90%;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    setupMobileGestures() {
        let startY;
        let startTime;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (e.cancelable && document.body.scrollTop === 0 && e.touches[0].clientY > startY) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    startBackgroundAnimation() {
        // Фоновая анимация управляется CSS
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, starting app");
    
    // Сначала проверяем, что все элементы существуют
    if (!elements.terminalScreen || !elements.mainApp) {
        console.error("Required elements not found!");
        // Показываем main-app если терминал не найден
        if (elements.mainApp) {
            elements.mainApp.style.display = 'block';
            elements.mainApp.classList.add('active');
            new TerminalBoot().initializeMainApp();
        }
        return;
    }
    
    const app = new TerminalBoot();
    app.start();
    
    // Установка высоты viewport для мобильных устройств
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Обработка появления клавиатуры на мобильных устройствах
    const handleKeyboard = () => {
        if (window.innerHeight < 500) {
            document.body.style.height = '100vh';
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
    };
    
    window.addEventListener('resize', handleKeyboard);
});

// Для отладки
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppState, TerminalBoot };
}