/* app.js
  NeoChat — improved app logic
  - Telegram SDK initialization (if available)
  - State management with localStorage
  - Message rendering + persistence
  - DeepSeek API interaction (with 402 handling)
  - Virtual keyboard with Shift + optional sound
*/

(() => {
  // ---------- Constants & Selectors ----------
  const SELECTORS = {
    messages: '#messages',
    input: '#inputField',
    sendBtn: '#sendBtn',
    settingsModal: '#settingsModal',
    apiKeyInput: '#apiKeyInput',
    testApiBtn: '#testApiBtn',
    testApiResult: '#testApiResult',
    saveSettings: '#saveSettings',
    btnOpenSettings: '#btnOpenSettings',
    btnThemeToggle: '#btnThemeToggle',
    themeButtons: '.theme-btn',
    statusDot: '#statusDot',
    statusText: '#statusText',
    virtualKeyboard: '#virtualKeyboard',
    toggleKeyboardSound: '#toggleKeyboardSound',
    quickButtons: '#quickButtons',
    btnClearHistory: '#btnClearHistory',
  };

  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));

  // ---------- App state ----------
  const defaultState = {
    apiKey: localStorage.getItem('deepseek_api_key') || '',
    theme: localStorage.getItem('app_theme') || 'dark',
    keyboardVisible: JSON.parse(localStorage.getItem('keyboard_visible') || 'true'),
    keyboardSound: JSON.parse(localStorage.getItem('keyboard_sound') || 'false'),
    messages: JSON.parse(localStorage.getItem('messages') || '[]'), // persisted across sessions
  };

  const state = {...defaultState};

  // ---------- Helpers ----------
  function saveState() {
    localStorage.setItem('deepseek_api_key', state.apiKey || '');
    localStorage.setItem('app_theme', state.theme || 'dark');
    localStorage.setItem('keyboard_visible', JSON.stringify(state.keyboardVisible));
    localStorage.setItem('keyboard_sound', JSON.stringify(state.keyboardSound));
    localStorage.setItem('messages', JSON.stringify(state.messages || []));
  }

  function uid(prefix='msg') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
  }

  function showNotification(text, type='info') {
    // minimal non-blocking toast
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    t.style.position = 'fixed';
    t.style.right = '16px';
    t.style.bottom = '16px';
    t.style.padding = '10px 12px';
    t.style.borderRadius = '10px';
    t.style.zIndex = 9999;
    t.style.background = type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(0,0,0,0.6)';
    t.style.color = 'white';
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 3000);
  }

  // ---------- Telegram SDK init ----------
  function initTelegram() {
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        try { tg.expand(); } catch(e) {}
        // optional header color
        try { tg.setHeaderColor(state.theme === 'light' ? '#ffffff' : '#000000'); } catch(e) {}
      }
    } catch (e) {
      // Not in telegram: ignore
      console.debug('Telegram SDK not available', e);
    }
  }

  // ---------- Rendering ----------
  const messagesNode = el(SELECTORS.messages);
  const template = document.getElementById('messageTemplate');

  function renderMessages() {
    messagesNode.innerHTML = '';
    for (const m of state.messages) {
      const node = renderMessage(m);
      messagesNode.appendChild(node);
    }
    messagesNode.scrollTop = messagesNode.scrollHeight;
  }

  function renderMessage(message) {
    const clone = template.content.cloneNode(true);
    const wrapper = clone.querySelector('.message');
    const bubble = clone.querySelector('.bubble');
    const textNode = clone.querySelector('.text');
    const meta = clone.querySelector('.meta');

    wrapper.dataset.id = message.id;
    if (message.type === 'user') {
      wrapper.classList.add('user-message');
      meta.textContent = `Вы • ${new Date(message.timestamp).toLocaleTimeString()}`;
    } else if (message.type === 'ai') {
      wrapper.classList.add('ai-message');
      meta.textContent = `DeepSeek • ${new Date(message.timestamp).toLocaleTimeString()}`;
    } else {
      meta.textContent = `Система • ${new Date(message.timestamp).toLocaleTimeString()}`;
    }

    // support simple markdown-ish code block rendering
    const html = formatMessageText(message.text || '');
    textNode.innerHTML = html;
    if (message.isLoading) {
      const loader = document.createElement('div');
      loader.className = 'loader';
      loader.textContent = '...';
      textNode.appendChild(loader);
    }

    return clone;
  }

  function formatMessageText(text) {
    if (!text) return '';
    // escape HTML
    const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // simple code blocks ``` -> pre
    const withPre = esc.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre style="white-space:pre-wrap;margin:6px 0;padding:8px;border-radius:6px;background:rgba(0,0,0,0.2)">${code}</pre>`);
    // inline code `code`
    const withInline = withPre.replace(/`([^`]+)`/g, (_m, c) => `<code style="padding:2px 6px;border-radius:4px;background:rgba(0,0,0,0.12)">${c}</code>`);
    // newlines -> <br>
    return withInline.replace(/\n/g,'<br>');
  }

  // ---------- Message management ----------
  function addMessage(type, text, {isLoading=false, id=null} = {}) {
    const message = {
      id: id || uid(),
      type,
      text,
      timestamp: Date.now(),
      isLoading
    };
    state.messages.push(message);
    saveState();
    renderMessages();
    return message;
  }

  function updateMessage(id, patch) {
    const idx = state.messages.findIndex(m => m.id === id);
    if (idx === -1) return;
    state.messages[idx] = {...state.messages[idx], ...patch};
    saveState();
    renderMessages();
  }

  function clearHistory() {
    state.messages = [];
    saveState();
    renderMessages();
    showNotification('История очищена');
  }

  // ---------- API Service ----------
  const DeepSeek = {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    async send(text, apiKey, opts={}) {
      // opts: {onProgress: fn}
      if (!apiKey) throw new Error('NO_API_KEY');
      const body = {
        model: 'deepseek-chat',
        messages: [{role:'user', content: text}],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      };
      try {
        const resp = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (resp.status === 401) {
          throw new Error('INVALID_KEY');
        }
        if (resp.status === 402) {
          // provide actionable message
          const hint = `Оплата требуется (402). Проверьте баланс на platform.deepseek.com, убедитесь что ключ активен или создайте новый ключ.`;
          throw Object.assign(new Error('PAYMENT_REQUIRED'), {hint});
        }
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`HTTP_${resp.status}: ${text}`);
        }

        const data = await resp.json();
        // try common shape: data.choices[0].message.content
        let reply = '';
        try {
          reply = data?.choices?.[0]?.message?.content || data?.result || JSON.stringify(data);
        } catch(e) {
          reply = JSON.stringify(data);
        }
        return reply;
      } catch (err) {
        throw err;
      }
    },

    async testKey(apiKey) {
      try {
        // lightweight call: ping model with empty message (or a short system prompt)
        const resp = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{role: 'system', content: 'ping'}],
            max_tokens: 1,
          })
        });
        if (resp.status === 402) return {ok:false, code:402};
        if (resp.status === 401) return {ok:false, code:401};
        return {ok: resp.ok, code: resp.status};
      } catch (e) {
        return {ok:false, code: null, error: e.message};
      }
    }
  };

  // ---------- Send workflow ----------
  async function handleSend(customText) {
    const input = el(SELECTORS.input);
    const rawText = (customText !== undefined) ? customText : input.value.trim();
    if (!rawText) {
      showNotification('Введите сообщение', 'error');
      return;
    }
    if (!state.apiKey) {
      showNotification('Установите API ключ в настройках', 'error');
      openSettings();
      return;
    }

    // Add user message
    const userMsg = addMessage('user', rawText);

    // Add placeholder AI message with loading state
    const aiPlaceholder = addMessage('ai', '...', {isLoading:true});
    // reset input
    input.value = '';
    input.style.height = 'auto';

    // Update status dot
    setApiStatus('loading');

    try {
      // call API
      const reply = await DeepSeek.send(rawText, state.apiKey);
      updateMessage(aiPlaceholder.id, {text: reply, isLoading: false});
      setApiStatus('ok');
    } catch (err) {
      let userMessage = 'Ошибка при обращении к DeepSeek';
      if (err.message === 'NO_API_KEY') userMessage = 'Нет API ключа';
      if (err.message === 'INVALID_KEY' || err.message === '401') userMessage = 'Неверный API ключ';
      if (err.message === 'PAYMENT_REQUIRED' || err.hint) userMessage = err.hint || 'Ошибка оплаты (402)';
      updateMessage(aiPlaceholder.id, {text: userMessage, isLoading: false});
      setApiStatus('error', userMessage);
      showNotification(userMessage, 'error');
    }
  }

  // ---------- API status UI ----------
  function setApiStatus(status, message='') {
    const dot = el(SELECTORS.statusDot);
    const text = el(SELECTORS.statusText);
    if (!dot || !text) return;
    if (status === 'ok') {
      dot.style.background = 'var(--success)';
      text.textContent = 'Connected';
    } else if (status === 'loading') {
      dot.style.background = 'orange';
      text.textContent = 'Thinking...';
    } else {
      dot.style.background = 'var(--error)';
      text.textContent = message || 'Disconnected';
    }
  }

  // ---------- Settings modal ----------
  function openSettings() {
    const modal = el(SELECTORS.settingsModal);
    modal.setAttribute('aria-hidden', 'false');
    const keyInput = el(SELECTORS.apiKeyInput);
    keyInput.value = state.apiKey || '';
    const soundToggle = el(SELECTORS.toggleKeyboardSound);
    soundToggle.checked = !!state.keyboardSound;
  }

  function closeSettings() {
    const modal = el(SELECTORS.settingsModal);
    modal.setAttribute('aria-hidden', 'true');
  }

  async function testApiKeyVisual() {
    const key = el(SELECTORS.apiKeyInput).value.trim();
    const resultBox = el(SELECTORS.testApiResult);
    resultBox.textContent = 'Проверяем...';
    const res = await DeepSeek.testKey(key);
    if (res.ok) {
      resultBox.textContent = 'Ключ валиден';
      resultBox.style.color = 'var(--success)';
    } else {
      resultBox.textContent = `Ошибка: ${res.code || res.error || 'неизвестно'}`;
      resultBox.style.color = 'var(--error)';
    }
  }

  // ---------- Virtual keyboard ----------
  class VirtualKeyboard {
    constructor(containerSelector) {
      this.container = el(containerSelector);
      this.isShift = false;
      this.sound = new Audio(); // simple beep
      // tiny generated sound (data URL)
      this.sound.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
      this.build();
    }

    build() {
      // keyboard layout (simple)
      const rows = [
        ['q','w','e','r','t','y','u','i','o','p'],
        ['a','s','d','f','g','h','j','k','l'],
        ['Shift','z','x','c','v','b','n','m','Back'],
        ['Space','.','@','Enter']
      ];
      this.container.innerHTML = '';
      for (const r of rows) {
        const row = document.createElement('div');
        row.className = 'keyboard-row';
        for (const k of r) {
          const key = document.createElement('button');
          key.className = 'key';
          key.type = 'button';
          key.textContent = k;
          key.dataset.key = k;
          key.addEventListener('click', ()=> this.handleKey(k));
          row.appendChild(key);
        }
        this.container.appendChild(row);
      }
    }

    handleKey(key) {
      const input = el(SELECTORS.input);
      if (!input) return;
      if (key === 'Back') {
        input.value = input.value.slice(0, -1);
      } else if (key === 'Shift') {
        this.isShift = !this.isShift;
        this.updateCase();
      } else if (key === 'Space') {
        input.value += ' ';
      } else if (key === 'Enter') {
        // send
        document.getElementById('sendBtn').click();
      } else {
        input.value += this.isShift ? key.toUpperCase() : key;
      }
      adjustTextareaHeight(input);
      if (state.keyboardSound) this.playSound();
    }

    updateCase() {
      const keys = this.container.querySelectorAll('.key');
      keys.forEach(k => {
        const text = k.dataset.key;
        if (text && text.length === 1) {
          k.textContent = this.isShift ? text.toUpperCase() : text.toLowerCase();
        }
      });
    }

    playSound() {
      try {
        this.sound.currentTime = 0;
        this.sound.play();
      } catch(e) {}
    }
  }

  // ---------- UI wiring ----------
  function setupUI() {
    // persist theme on root
    document.documentElement.setAttribute('data-theme', state.theme);

    // fill saved messages
    renderMessages();

    // create keyboard
    window.vkeyboard = new VirtualKeyboard(SELECTORS.virtualKeyboard);
    window.vkeyboard.isShift = false;
    window.vkeyboard.updateCase();

    // Input autosize
    const input = el(SELECTORS.input);
    const sendBtn = el(SELECTORS.sendBtn);
    input.addEventListener('input', ()=> adjustTextareaHeight(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });

    // send
    sendBtn.addEventListener('click', ()=> handleSend());

    // quick buttons
    const qb = el(SELECTORS.quickButtons);
    qb.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-btn');
      if (!btn) return;
      const mode = btn.dataset.mode;
      if (mode === 'code') input.value = '/code ' + input.value;
      if (mode === 'explain') input.value = '/explain ' + input.value;
      if (mode === 'translate') input.value = '/translate ' + input.value;
      input.focus();
    });

    // settings open
    el(SELECTORS.btnOpenSettings).addEventListener('click', openSettings);
    el('#closeSettings').addEventListener('click', closeSettings);
    el(SELECTORS.saveSettings).addEventListener('click', () => {
      state.apiKey = el(SELECTORS.apiKeyInput).value.trim();
      state.keyboardSound = el(SELECTORS.toggleKeyboardSound).checked;
      saveState();
      closeSettings();
      showNotification('Настройки сохранены');
    });

    el(SELECTORS.testApiBtn).addEventListener('click', testApiKeyVisual);

    // theme buttons
    els(SELECTORS.themeButtons).forEach(b => {
      b.addEventListener('click', () => {
        state.theme = b.dataset.theme;
        document.documentElement.setAttribute('data-theme', state.theme);
        saveState();
        showNotification(`Тема: ${state.theme}`);
      });
    });

    el(SELECTORS.btnThemeToggle).addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', state.theme);
      saveState();
    });

    // keyboard sound toggle
    el(SELECTORS.toggleKeyboardSound).addEventListener('change', (e) => {
      state.keyboardSound = e.target.checked;
      saveState();
    });

    el(SELECTORS.btnClearHistory).addEventListener('click', () => {
      if (confirm('Очистить историю?')) clearHistory();
    });

    // basic accessibility: focus input when clicking messages area
    el(SELECTORS.messages).addEventListener('click', ()=> el(SELECTORS.input).focus());
  }

  function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  // ---------- Boot ----------
  function boot() {
    initTelegram();
    setupUI();
    // restore apiKey into settings input if modal opens later
    const savedKey = state.apiKey || '';
    // attempt to set status
    if (state.apiKey) {
      DeepSeek.testKey(state.apiKey).then(r => {
        if (r.ok) setApiStatus('ok'); else setApiStatus('error', 'Invalid API');
      });
    } else {
      setApiStatus('error', 'No API key');
    }
  }

  // run
  document.addEventListener('DOMContentLoaded', boot);

})();