// app.js - Логика для eDEX-UI лаунчера

document.addEventListener('DOMContentLoaded', function() {
    console.log('[SYSTEM] eDEX-UI Launcher Initializing...');

    // ===== 1. ИНИЦИАЛИЗАЦИЯ КОМПОНЕНТОВ =====
    const state = {
        cpuUsage: 15,
        ramUsage: 45,
        networkLoad: 120, // KB/s
        isTerminalActive: true
    };

    // ===== 2. ОБНОВЛЕНИЕ СИСТЕМНОЙ ИНФОРМАЦИИ В РЕАЛЬНОМ ВРЕМЕНИ =====
    function updateSystemInfo() {
        const now = new Date();
        
        // Обновление времени
        const timeString = now.toLocaleTimeString('en-GB', { hour12: false }); // Формат 24ч
        const timeDisplay = document.getElementById('timeDisplay');
        if(timeDisplay) timeDisplay.textContent = timeString;
        
        // Обновление фиктивных показателей системы (случайные колебания)
        state.cpuUsage = Math.max(5, Math.min(95, state.cpuUsage + (Math.random() * 6 - 3)));
        state.ramUsage = Math.max(20, Math.min(85, state.ramUsage + (Math.random() * 4 - 2)));
        state.networkLoad = Math.max(10, Math.min(1000, state.networkLoad + (Math.random() * 40 - 20)));
        
        // Обновление текстовых полей
        const cpuElem = document.getElementById('cpuValue');
        const ramElem = document.getElementById('ramValue');
        const netElem = document.getElementById('netValue');
        
        if(cpuElem) cpuElem.textContent = Math.round(state.cpuUsage) + '%';
        if(ramElem) ramElem.textContent = Math.round(state.ramUsage) + '%';
        if(netElem) netElem.textContent = Math.round(state.networkLoad) + ' KB/s';
        
        // Обновление индикаторов-полосок
        const cpuGauge = document.getElementById('cpuGauge');
        const ramGauge = document.getElementById('ramGauge');
        const netGauge = document.getElementById('netGauge');
        
        if(cpuGauge) cpuGauge.style.width = state.cpuUsage + '%';
        if(ramGauge) ramGauge.style.width = state.ramUsage + '%';
        if(netGauge) netGauge.style.width = Math.min(state.networkLoad / 10, 100) + '%'; // Масштабирование
    }

    // Запускаем обновление каждые 2 секунды
    setInterval(updateSystemInfo, 2000);
    updateSystemInfo(); // Первый вызов

    // ===== 3. ЭМУЛЯЦИЯ РАБОЧЕГО ТЕРМИНАЛА =====
    const termInput = document.getElementById('termInput');
    const termContent = document.getElementById('termContent');
    
    // История команд
    const commandHistory = [];
    let historyIndex = -1;
    
    // Доступные команды
    const commands = {
        'help': 'Доступные команды: help, clear, system, network, date, time, echo [text], ls, dummy [app]',
        'clear': function() {
            if(termContent) {
                // Сохраняем только строку ввода
                const inputLine = termContent.querySelector('.term-input-line');
                termContent.innerHTML = '';
                if(inputLine) termContent.appendChild(inputLine);
                addTerminalOutput('Терминал очищен.', 'system');
            }
        },
        'system': `Системная информация (демо):
        CPU: ${state.cpuUsage.toFixed(1)}%
        RAM: ${state.ramUsage.toFixed(1)}%
        NET: ${state.networkLoad.toFixed(0)} KB/s
        ОС: eDEX-UI Launcher v1.0`,
        'network': 'Сетевой статус: ДЕМО-РЕЖИМ | Пинг: <1 мс | Активных соединений: 12',
        'date': new Date().toLocaleDateString(),
        'time': new Date().toLocaleTimeString(),
        'ls': 'apps/  system/  logs/  temp/  config.ini  readme.txt',
        'echo': function(args) {
            return args.join(' ');
        }
    };
    
    function addTerminalOutput(text, type = 'output') {
        if(!termContent) return;
        
        const outputLine = document.createElement('div');
        outputLine.className = 'term-output';
        
        if(type === 'system') {
            outputLine.style.color = '#00aaff';
            outputLine.textContent = '[SYS] ' + text;
        } else if(type === 'error') {
            outputLine.style.color = '#ff5555';
            outputLine.textContent = '[ERR] ' + text;
        } else {
            outputLine.textContent = text;
        }
        
        termContent.insertBefore(outputLine, termContent.querySelector('.term-input-line'));
        // Автопрокрутка вниз
        termContent.scrollTop = termContent.scrollHeight;
    }
    
    function processCommand(input) {
        if(!input.trim()) return;
        
        // Добавляем в историю
        commandHistory.push(input);
        historyIndex = commandHistory.length;
        
        // Показываем команду в терминале
        addTerminalOutput(`root@edex-ui:~$ ${input}`, 'command');
        
        // Разбираем команду
        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Обработка
        if(commands.hasOwnProperty(cmd)) {
            if(typeof commands[cmd] === 'function') {
                const result = commands[cmd](args);
                if(result !== undefined) addTerminalOutput(result);
            } else {
                addTerminalOutput(commands[cmd]);
            }
        } 
        else if(cmd.startsWith('dummy')) {
            const appName = args[0] || 'unknown';
            addTerminalOutput(`Запуск заглушки приложения: "${appName}"`, 'system');
            addTerminalOutput(`Статус: Функциональность "${appName}" не реализована. Это демо-лаунчер.`, 'system');
        }
        else {
            addTerminalOutput(`Команда не найдена: "${cmd}". Введите "help" для списка команд.`, 'error');
        }
    }
    
    // Обработка нажатия Enter в терминале
    if(termInput) {
        termInput.addEventListener('keydown', function(e) {
            if(e.key === 'Enter') {
                processCommand(this.value);
                this.value = '';
            }
            // Навигация по истории стрелками
            else if(e.key === 'ArrowUp') {
                e.preventDefault();
                if(commandHistory.length > 0) {
                    historyIndex = Math.max(historyIndex - 1, 0);
                    this.value = commandHistory[historyIndex] || '';
                }
            }
            else if(e.key === 'ArrowDown') {
                e.preventDefault();
                if(commandHistory.length > 0) {
                    historyIndex = Math.min(historyIndex + 1, commandHistory.length);
                    this.value = commandHistory[historyIndex] || '';
                }
            }
        });
        
        // Фокус на поле ввода при клике в любом месте терминала
        termContent?.addEventListener('click', () => {
            termInput.focus();
        });
    }
    
    // Добавляем начальное приветствие
    setTimeout(() => {
        addTerminalOutput('Добро пожаловать в eDEX-UI Launcher (Демо-версия)', 'system');
        addTerminalOutput('Введите "help" для списка команд, или кликните на иконку приложения.', 'system');
    }, 500);

    // ===== 4. ЗАГЛУШКИ ПРИЛОЖЕНИЙ =====
    const appIcons = document.querySelectorAll('.app-icon');
    
    appIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const appName = this.querySelector('.app-name').textContent;
            const appIcon = this.querySelector('i').className;
            
            // Эффект нажатия
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Логируем в терминал
            addTerminalOutput(`Запуск приложения: ${appName}`, 'system');
            addTerminalOutput(`> Это заглушка. Реальное приложение "${appName}" не установлено.`, 'system');
            
            // Специальные действия для некоторых иконок
            switch(appName.trim().toLowerCase()) {
                case 'system':
                    addTerminalOutput('> Показана панель мониторинга слева.', 'system');
                    break;
                case 'terminal':
                    addTerminalOutput('> Терминал уже активен. Можно вводить команды.', 'system');
                    termInput?.focus();
                    break;
                case 'power':
                    addTerminalOutput('> Имитация выключения...', 'system');
                    setTimeout(() => {
                        addTerminalOutput('> [ДЕМО] Система была бы выключена.', 'system');
                    }, 1000);
                    break;
            }
        });
    });

    // ===== 5. КНОПКИ ВИРТУАЛЬНОЙ КЛАВИАТУРЫ =====
    const keys = document.querySelectorAll('.key');
    
    keys.forEach(key => {
        key.addEventListener('click', function() {
            const keyName = this.textContent;
            addTerminalOutput(`[KEY] Нажата виртуальная клавиша: ${keyName}`, 'system');
            
            // Специальные действия для некоторых клавиш
            if(keyName === 'Ctrl' && termInput) {
                termInput.value = '';
                termInput.focus();
            } else if(keyName === 'Esc') {
                addTerminalOutput('> Команда отменена.', 'system');
            }
        });
    });

    // ===== 6. ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА =====
    console.log('[SYSTEM] eDEX-UI Launcher Ready.');
    addTerminalOutput('Система инициализирована. Ожидание команд...', 'system');
});