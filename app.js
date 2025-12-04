// app.js - MIA AI Assistant Application Logic

// Application State
const AppState = {
    terminalLoaded: false,
    selectedPlan: null,
    userSubscribed: false,
    userLoggedIn: false, // Added login state
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
    vkAuth: document.getElementById('vkAuth'),
    typeSound: document.getElementById('typeSound')
};

// Terminal Boot Sequence (English only) - Ускоренная анимация
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
        this.lineDelay = 120; // Ускорено с 200
        this.charDelay = 15; // Ускорено с 30
        this.soundPlayed = false;
    }

    async start() {
        return new Promise((resolve) => {
            // Начинаем воспроизведение звука после первого взаимодействия
            this.setupSound();
            this.showNextMessage(resolve);
        });
    }

    setupSound() {
        // Подготовка звука для воспроизведения при анимации
        if (elements.typeSound) {
            elements.typeSound.volume = 0.3;
            elements.typeSound.loop = false;
        }
    }

    playTypeSound() {
        if (elements.typeSound && !this.soundPlayed) {
            try {
                // Воспроизводим звук с перемоткой в начало
                elements.typeSound.currentTime = 0;
                elements.typeSound.play().catch(e => {
                    console.log("Audio play failed:", e);
                });
                this.soundPlayed = true;
                
                // Сбрасываем флаг через короткое время
                setTimeout(() => {
                    this.soundPlayed = false;
                }, 300);
            } catch (e) {
                console.log("Sound error:", e);
            }
        }
    }

    showNextMessage(resolve) {
        if (this.messageIndex >= bootMessages.length) {
            setTimeout(() => {
                this.fadeOutTerminal();
                resolve();
            }, 400); // Ускорено с 700
            return;
        }

        const message = bootMessages[this.messageIndex];
        
        // Воспроизводим звук в начале печати каждой строки
        if (this.messageIndex % 2 === 0) { // Каждую вторую строку
            this.playTypeSound();
        }
        
        this.typeMessage(message, () => {
            this.messageIndex++;
            setTimeout(() => this.showNextMessage(resolve), this.lineDelay);
        });
    }

    typeMessage(message, callback) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.style.animationDelay = `${this.messageIndex * 0.05}s`; // Ускорено
        elements.terminalContent.appendChild(line);

        let charIndex = 0;
        
        const typeChar = () => {
            if (charIndex < message.length) {
                line.textContent += message.charAt(charIndex);
                charIndex++;
                
                // Иногда воспроизводим звук при печати символов
                if (charIndex % 10 === 0 && this.messageIndex > 0) {
                    this.playTypeSound();
                }
                
                setTimeout(typeChar, this.charDelay);
            } else {
                callback();
            }
        };

        typeChar();
        
        // Scroll to bottom
        elements.terminalContent.scrollTop = elements.terminalContent.scrollHeight;
    }

    fadeOutTerminal() {
        elements.terminalScreen.classList.add('fade-out');
        setTimeout(() => {
            elements.terminalScreen.style.display = 'none';
            elements.mainApp.style.display = 'block';
            AppState.currentScreen = 'main';
            this.initializeMainApp();
        }, 700); // Ускорено с 1000
    }

    initializeMainApp() {
        // Update subscribe button text based on subscription status
        if (AppState.userSubscribed) {
            elements.subscribeBtn.textContent = 'Продлить подписку';
        }
        
        // Add event listeners
        this.setupEventListeners();
        
        // Initialize animations
        this.startBackgroundAnimation();
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
        
        // Auth Button
        elements.authButton.addEventListener('click', this.toggleAuthButtons.bind(this));
        
        // Social Auth Buttons
        elements.googleAuth.addEventListener('click', () => this.handleSocialAuth('google'));
        elements.telegramAuth.addEventListener('click', () => this.handleSocialAuth('telegram'));
        elements.miaAuth.addEventListener('click', () => this.handleSocialAuth('mia'));
        elements.vkAuth.addEventListener('click', () => this.handleSocialAuth('vk'));
        
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
        
        // Terms link is already handled by href attribute
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.settingsBtn.contains(e.target) && 
                !elements.settingsMenu.contains(e.target) &&
                elements.settingsMenu.style.display === 'flex') {
                this.closeSettingsMenu();
            }
            
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

    openSettingsMenu() {
        elements.settingsMenu.style.display = 'flex';
        setTimeout(() => {
            elements.settingsMenu.classList.remove('closing');
        }, 10);
    }

    closeSettingsMenu() {
        elements.settingsMenu.classList.add('closing');
        setTimeout(() => {
            elements.settingsMenu.style.display = 'none';
            elements.settingsMenu.classList.remove('closing');
            
            // Reset auth buttons to initial state
            this.resetAuthButtons();
        }, 300);
    }

    openSubscriptionMenu(e) {
        e.preventDefault();
        elements.subscriptionMenu.style.display = 'flex';
        setTimeout(() => {
            elements.subscriptionMenu.classList.remove('closing');
        }, 10);
    }

    closeSubscriptionMenu() {
        elements.subscriptionMenu.classList.add('closing');
        setTimeout(() => {
            elements.subscriptionMenu.style.display = 'none';
            elements.subscriptionMenu.classList.remove('closing');
            elements.paymentMethods.style.display = 'none';
            elements.payButton.style.display = 'block';
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
        elements.supportMenu.style.display = 'flex';
        setTimeout(() => {
            elements.supportMenu.classList.remove('closing');
        }, 10);
    }

    closeSupportMenu() {
        elements.supportMenu.classList.add('closing');
        setTimeout(() => {
            elements.supportMenu.style.display = 'none';
            elements.supportMenu.classList.remove('closing');
        }, 300);
    }

    closeAllMenus() {
        if (elements.settingsMenu.style.display === 'flex') {
            this.closeSettingsMenu();
        }
        if (elements.subscriptionMenu.style.display === 'flex') {
            this.closeSubscriptionMenu();
        }
        if (elements.supportMenu.style.display === 'flex') {
            this.closeSupportMenu();
        }
    }

    // New methods for auth buttons
    toggleAuthButtons() {
        if (elements.socialAuthButtons.style.display === 'none' || 
            elements.socialAuthButtons.style.display === '') {
            this.showSocialAuthButtons();
        } else {
            this.hideSocialAuthButtons();
        }
    }

    showSocialAuthButtons() {
        // Hide main auth button with animation
        elements.authButton.style.opacity = '0';
        elements.authButton.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            elements.authButton.style.display = 'none';
            elements.socialAuthButtons.style.display = 'grid';
            
            // Animate social buttons in
            setTimeout(() => {
                elements.socialAuthButtons.style.opacity = '0';
                elements.socialAuthButtons.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    elements.socialAuthButtons.style.opacity = '1';
                    elements.socialAuthButtons.style.transform = 'translateY(0)';
                    elements.socialAuthButtons.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    
                    // Animate each button with delay
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
        // Animate social buttons out
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
        
        // Simulate successful login
        setTimeout(() => {
            AppState.userLoggedIn = true;
            this.showNotification('Успешная авторизация!');
            this.hideSocialAuthButtons();
            
            // Update UI for logged in state
            elements.authButton.innerHTML = `
                <div class="auth-main-text">Профиль</div>
                <div class="auth-sub-text">Вы вошли в систему</div>
            `;
            elements.authButton.style.background = 'linear-gradient(135deg, #00ff88, #00ccff)';
        }, 1000);
    }

    selectPlan(card) {
        // Remove selection from all cards
        elements.planCards.forEach(c => {
            c.classList.remove('selected');
            c.style.transform = '';
        });
        
        // Add selection to clicked card
        card.classList.add('selected');
        card.style.transform = 'scale(1.08)';
        
        // Store selected plan
        AppState.selectedPlan = {
            plan: card.dataset.plan,
            price: card.dataset.price,
            duration: card.querySelector('.plan-duration').textContent
        };
        
        console.log('Selected plan:', AppState.selectedPlan);
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
        
        elements.payButton.style.display = 'none';
        elements.paymentMethods.style.display = 'flex';
        
        // Animate payment methods
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

    processPayment(method) {
        if (!AppState.selectedPlan) return;
        
        const paymentData = {
            method: method,
            plan: AppState.selectedPlan.plan,
            amount: AppState.selectedPlan.price,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        console.log('Processing payment:', paymentData);
        
        // Simulate payment processing
        this.showPaymentProcessing(method);
    }

    showPaymentProcessing(method) {
        let message = '';
        let redirectUrl = '#';
        
        switch(method) {
            case 'sber':
                message = 'Перенаправление в СберБанк Онлайн...';
                redirectUrl = 'sberbank://payment';
                break;
            case 'card':
                message = 'Открытие формы оплаты картой...';
                break;
            case 'sbp':
                message = 'Генерация QR-кода для СБП...';
                break;
        }
        
        this.showNotification(message);
        
        // Simulate redirect after delay
        setTimeout(() => {
            if (method === 'sber' || method === 'sbp') {
                this.showNotification('Оплата успешна! Подписка активирована.');
                AppState.userSubscribed = true;
                elements.subscribeBtn.textContent = 'Продлить подписку';
                this.closeSubscriptionMenu();
            }
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
        // Create notification element
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
     