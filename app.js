// app.js - MIA AI Assistant Application Logic

// Application State
const AppState = {
    terminalLoaded: false,
    selectedPlan: null,
    userSubscribed: false,
    currentScreen: 'terminal',
    user: null
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
    skipTerminalBtn: document.getElementById('skipTerminalBtn'),
    typeSound: document.getElementById('typeSound'),
    googleAuthItem: document.getElementById('googleAuthItem')
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
        this.isSkipped = false;
        this.audioContext = null;
        this.shouldPlaySound = true;
        this.timeoutIds = [];
    }

    async start() {
        // Инициализация звука
        this.initSound();
        
        // Загрузка состояния пользователя
        this.loadUserState();
        
        return new Promise((resolve) => {
            this.showNextMessage(resolve);
        });
    }

    initSound() {
        // Создаем звук печати с помощью Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log("Web Audio API не поддерживается");
            this.shouldPlaySound = false;
        }
    }

    playTypeSound() {
        if (!this.shouldPlaySound || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800 + Math.random() * 400;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    showNextMessage(resolve) {
        if (this.messageIndex >= bootMessages.length) {
            setTimeout(() => {
                this.fadeOutTerminal();
                resolve();
            }, 700);
            return;
        }

        const message = bootMessages[this.messageIndex];
        this.typeMessage(message, () => {
            this.messageIndex++;
            const timeoutId = setTimeout(() => this.showNextMessage(resolve), this.lineDelay);
            this.timeoutIds.push(timeoutId);
        });
    }

    typeMessage(message, callback) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.style.animationDelay = `${this.messageIndex * 0.1}s`;
        elements.terminalContent.appendChild(line);

        let charIndex = 0;
        
        const typeChar = () => {
            if (this.isSkipped) {
                line.textContent = message;
                callback();
                return;
            }
            
            if (charIndex < message.length) {
                line.textContent += message.charAt(charIndex);
                charIndex++;
                
                // Воспроизводим звук для каждого символа (кроме пробела)
                if (message.charAt(charIndex - 1) !== ' ') {
                    this.playTypeSound();
                }
                
                const timeoutId = setTimeout(typeChar, this.charDelay);
                this.timeoutIds.push(timeoutId);
            } else {
                callback();
            }
        };

        typeChar();
        
        // Scroll to bottom
        elements.terminalContent.scrollTop = elements.terminalContent.scrollHeight;
    }

    skipAnimation() {
        this.isSkipped = true;
        
        // Очищаем все таймауты
        this.timeoutIds.forEach(id => clearTimeout(id));
        this.timeoutIds = [];
        
        // Показываем все сообщения сразу
        elements.terminalContent.innerHTML = '';
        bootMessages.forEach((message, index) => {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.style.animationDelay = `${index * 0.1}s`;
            line.style.opacity = '1';
            line.textContent = message;
            elements.terminalContent.appendChild(line);
        });
        
        // Прокручиваем вниз
        elements.terminalContent.scrollTop = elements.terminalContent.scrollHeight;
        
        // Немедленно переходим к завершению
        setTimeout(() => {
            this.fadeOutTerminal();
        }, 300);
    }

    fadeOutTerminal() {
        elements.terminalScreen.classList.add('fade-out');
        setTimeout(() => {
            elements.terminalScreen.style.display = 'none';
            elements.mainApp.style.display = 'block';
            AppState.currentScreen = 'main';
            this.initializeMainApp();
        }, 1000);
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
        
        // Google Auth
        elements.googleAuthItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleGoogleAuth();
        });
        
        // Skip terminal button
        elements.skipTerminalBtn.addEventListener('click', () => {
            this.skipAnimation();
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

    openSettingsMenu() {
        elements.settingsMenu.style.display = 'flex';
        setTimeout(() => {
            elements.settingsMenu.classList.remove('closing');
        }, 10);
        
        // Обновляем пункт входа через Google в зависимости от состояния
        this.updateGoogleAuthButton();
    }

    updateGoogleAuthButton() {
        if (AppState.user) {
            elements.googleAuthItem.innerHTML = `
                <i class="fas fa-user-circle"></i> 
                ${AppState.user.name} (Выйти)
            `;
        } else {
            elements.googleAuthItem.innerHTML = `
                <i class="fab fa-google"></i> Войти через Google
            `;
        }
    }

    handleGoogleAuth() {
        if (AppState.user) {
            // Выход
            this.logout();
        } else {
            // Имитация входа через Google
            this.mockGoogleAuth();
        }
    }

    mockGoogleAuth() {
        // В реальном приложении здесь было бы перенаправление на OAuth Google
        // Для демонстрации мы используем моковые данные
        const mockUser = {
            id: 'google_123456',
            name: 'Пользователь Google',
            email: 'user@gmail.com',
            avatar: 'https://via.placeholder.com/40',
            loginMethod: 'google'
        };
        
        this.login(mockUser);
        this.showNotification('Успешный вход через Google');
    }

    login(userData) {
        AppState.user = userData;
        this.saveUserState();
        this.updateGoogleAuthButton();
    }

    logout() {
        AppState.user = null;
        this.saveUserState();
        this.updateGoogleAuthButton();
        this.showNotification('Вы вышли из аккаунта');
    }

    saveUserState() {
        localStorage.setItem('mia_user', JSON.stringify(AppState.user));
        localStorage.setItem('mia_subscription', JSON.stringify(AppState.userSubscribed));
    }

    loadUserState() {
        const savedUser = localStorage.getItem('mia_user');
        const savedSubscription = localStorage.getItem('mia_subscription');
        
        if (savedUser) {
            AppState.user = JSON.parse(savedUser);
        }
        
        if (savedSubscription) {
            AppState.userSubscribed = JSON.parse(savedSubscription);
        }
    }

    closeSettingsMenu() {
        elements.settingsMenu.classList.add('closing');
        setTimeout(() => {
            elements.settingsMenu.style.display = 'none';
            elements.settingsMenu.classList.remove('closing');
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

    selectPlan(card) {
        // Remove selection from all cards
        elements.planCards.forEach(c => {
            c.classList.remove('selected');
            c.style.transform = '';
        });
        
        // Add selection to clicked card
        card.classList.add('selected');
        card.style.transform = 'scale(1.05)';
        
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
        
        // In a real app, you would:
        // 1. Send payment data to your backend
        // 2. Redirect to payment gateway
        // 3. Handle the callback
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
                // In real app: show card form
                break;
            case 'sbp':
                message = 'Генерация QR-кода для СБП...';
                // In real app: generate QR code
                break;
        }
        
        this.showNotification(message);
        
        // Simulate redirect after delay
        setTimeout(() => {
            if (method === 'sber' || method === 'sbp') {
                // In real app: window.location.href = redirectUrl;
                this.showNotification('Оплата успешна! Подписка активирована.');
                AppState.userSubscribed = true;
                elements.subscribeBtn.textContent = 'Продлить подписку';
                this.saveUserState();
                this.closeSubscriptionMenu();
            }
        }, 2000);
    }

    showPaymentManagement() {
        this.showNotification('Система управления оплатой откроется здесь');
        // In real app: open payment management interface
    }

    showTransactions() {
        this.showNotification('История транзакций будет отображена здесь');
        // In real app: show transaction history
    }

    showReferralProgram() {
        this.showNotification('Интерфейс реферальной программы откроется здесь');
        // In real app: open referral program
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
        let startY;
        let startTime;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            // Prevent rubber-band scrolling on iOS
            if (e.cancelable && document.body.scrollTop === 0 && e.touches[0].clientY > startY) {
                e.preventDefault();
            }
   