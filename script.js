const validateUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};
const safeSetInnerHTML = (el, html) => {
  if (!el) return;
  el.innerHTML = '';
  const div = document.createElement('div');
  div.innerHTML = html;
  el.appendChild(div);
};

const desktop = document.querySelector('#desktop');
const windowLayer = document.querySelector('#windowLayer');
const launcherPanel = document.querySelector('#launcherPanel');
const windowTray = document.querySelector('#windowTray');
const openWindows = new Map();
let highestZ = 5;
const storage = {
  get(key, fallback = null) { 
    try { 
      return localStorage.getItem(key) ?? fallback; 
    } catch { 
      return fallback; 
    } 
  },
  set(key, value) { 
    try { 
      localStorage.setItem(key, value);
      return true;
    } catch (e) { 
      console.warn('Storage unavailable:', e.message);
      return false;
    } 
  }
};
function readStoredFiles() {
  try { return JSON.parse(storage.get('orbit-files', '[]')); }
  catch { return []; }
}
const state = {
  notes: storage.get('orbit-notes') || 'A small thought is still worth keeping.',
  theme: storage.get('orbit-theme') || 'light',
  files: readStoredFiles(),
  mood: (() => { try { return JSON.parse(storage.get('orbit-mood', 'null')); } catch { return null; } })()
};
const moodColors = [['#d4f36a', '#ff816b', '#94bff5'], ['#f6c453', '#ef806d', '#83c5be'], ['#e6a8d7', '#8bc6f2', '#b4dd91'], ['#ffcf9f', '#c0a7f5', '#a9d8e5']];
if (!state.files.length) state.files = [{ name: 'ideas.txt', type: 'TEXT', content: 'Collect the ideas that deserve a little more orbit.' }, { name: 'orbit.config', type: 'CONFIG', content: 'theme=light\nworkspace=personal' }];
function setTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  storage.set('orbit-theme', theme);
  document.querySelectorAll('.theme-choice').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.theme === theme)); });
}
if (Array.isArray(state.mood) && state.mood.length === 3) ['--lime', '--coral', '--blue'].forEach((name, index) => document.documentElement.style.setProperty(name, state.mood[index]));
setTheme(state.theme === 'dark' ? 'dark' : 'light');

const apps = {
  notes: {
    title: 'Notes',
    content: '<textarea class="notes-editor" aria-label="Notes" placeholder="Start writing..."></textarea><p class="save-state" aria-live="polite">Saved locally</p>'
  },
  files: {
    title: 'Files',
    content: '<div class="files-heading"><span>WORKSPACE</span><button class="new-file" aria-label="Create a new file">+ New file</button></div><div class="files-list"></div>'
  },
  terminal: {
    title: 'Terminal',
    content: '<div class="terminal-body window-content"><div class="terminal-output"><p>Orbit Terminal 1.0</p><p>Type <strong>help</strong> to see available commands.</p></div><form class="terminal-input"><span>orbit $</span><input aria-label="Terminal command" autocomplete="off" /></form></div>'
  },
  about: {
    title: 'About Orbit',
    content: '<p><strong>ORBIT WEB OS</strong></p><p>A tiny browser desktop made with plain HTML, CSS, and JavaScript. Built for focus, curiosity, and the occasional beautifully organized folder.</p><p class="file-type">VERSION 1.0.0</p>'
  },
  browser: {
    title: 'Orbit Browser',
    content: '<div class="browser-toolbar"><button class="browser-control browser-back" aria-label="Go back">&#8592;</button><button class="browser-control browser-forward" aria-label="Go forward">&#8594;</button><button class="browser-control browser-reload" aria-label="Reload page">&#8635;</button><div class="address-form"><span class="address-lock">&#9673;</span><input class="address-input" aria-label="Website address" value="https://example.com" /><button class="address-submit" type="button" aria-label="Search website">&#8981;</button></div><button class="external-link" aria-label="Open website in new tab">&#8599;</button></div><div class="browser-message" hidden></div><iframe class="browser-frame" title="Web browser" src="https://example.com"></iframe>'
  },
  calculator: {
    title: 'Calculator',
    content: '<div class="calculator"><output class="calculator-display" aria-live="polite">0</output><div class="calculator-keys"><button data-key="clear">C</button><button data-key="backspace">&#9003;</button><button data-key="operator">÷</button><button data-key="operator">×</button><button data-key="7">7</button><button data-key="8">8</button><button data-key="9">9</button><button data-key="operator">−</button><button data-key="4">4</button><button data-key="5">5</button><button data-key="6">6</button><button data-key="operator">+</button><button data-key="1">1</button><button data-key="2">2</button><button data-key="3">3</button><button class="equals-key" data-key="equals">=</button><button class="zero-key" data-key="0">0</button><button data-key="decimal">.</button></div></div>'
  },
  paint: {
    title: 'Paint',
    content: '<div class="paint-tools"><label>Color <input class="paint-color" type="color" value="#13211f" /></label><label>Size <input class="paint-size" type="range" min="2" max="30" value="6" /></label><button class="paint-clear">Clear</button><button class="paint-save">Save</button></div><canvas class="paint-canvas" width="700" height="400" aria-label="Paint canvas"></canvas>'
  },
  clock: {
    title: 'Clock',
    content: '<div class="clock-app"><div class="clock-time">00:00:00</div><div class="clock-date">Loading date...</div><div class="clock-meta"><span>LOCAL TIME</span><span class="clock-zone"></span></div></div>'
  },
  game: {
    title: 'Orbit Dash',
    content: '<div class="game-app"><div class="game-score">SCORE <strong>0</strong></div><div class="game-board"><button class="game-target" aria-label="Orbit target">◆</button></div><p class="game-hint">Catch the target. It moves every round.</p><button class="game-start">Start game</button></div>'
  },
  calendar: {
    title: 'Calendar',
    content: '<div class="calendar-app"><div class="calendar-heading"><button class="calendar-prev" aria-label="Previous month">←</button><strong class="calendar-month"></strong><button class="calendar-next" aria-label="Next month">→</button></div><div class="calendar-grid"></div></div>'
  },
  snake: {
    title: 'Snake',
    content: '<div class="snake-app"><div class="game-score">SCORE <strong>0</strong></div><canvas class="snake-canvas" width="320" height="320" aria-label="Snake game board"></canvas><p class="game-hint">Use arrow keys or WASD to move.</p><button class="game-start">Start game</button></div>'
  },
  minesweeper: {
    title: 'Minesweeper',
    content: '<div class="mines-app"><div class="game-score"><span>MINES <strong>10</strong></span><span class="mines-status">Ready</span></div><div class="mines-grid" role="grid"></div><p class="game-hint">Reveal every safe square. Right-click to flag.</p><button class="mines-reset">New board</button></div>'
  },
  camera: {
    title: 'Camera',
    content: '<div class="camera-app"><video class="camera-preview" autoplay playsinline aria-label="Camera preview"></video><p class="camera-status">Camera access is off.</p><div class="camera-actions"><button class="camera-start">Enable camera</button><button class="camera-snap" disabled>Take snapshot</button></div><canvas class="camera-snapshot" hidden></canvas></div>'
  },
  instagram: { title: 'Instagram', externalUrl: 'https://www.instagram.com/' },
  whatsapp: { title: 'WhatsApp Web', externalUrl: 'https://web.whatsapp.com/' },
  youtube: { title: 'YouTube', externalUrl: 'https://www.youtube.com/' },
  random: {
    title: 'Random Lab',
    content: '<div class="random-lab"><p>Four ways to shake up the workspace.</p><div class="random-actions"><button class="random-style">Random style</button><button class="random-number">Random 10,000</button><button class="random-data">Generate 10,000</button></div><form class="random-custom"><input aria-label="Custom random range" type="number" min="1" max="1000000" value="10000" /><button type="submit">Custom</button></form><p class="random-output" aria-live="polite">Ready for a little entropy.</p></div>'
  }
};

// each app wires up its own behavior when its window opens
const mounts = {
  notes(win) {
    const editor = win.querySelector('.notes-editor');
    editor.value = state.notes;
    editor.addEventListener('input', () => {
      state.notes = editor.value;
      storage.set('orbit-notes', state.notes);
    });
  },

  calculator(win) {
    const display = win.querySelector('.calculator-display');
    let expression = '';
    win.querySelector('.calculator').addEventListener('click', (event) => {
      const key = event.target.closest('[data-key]')?.dataset.key;
      if (!key) return;
      if (key === 'clear') expression = '';
      else if (key === 'backspace') expression = expression.slice(0, -1);
      else if (key === 'equals') {
        try {
          const formula = expression.replaceAll('×', '*').replaceAll('÷', '/');
          if (!/^[0-9+\-*/.() ]+$/.test(formula)) throw new Error('bad expression');
          expression = String(Function(`"use strict"; return (${formula})`)());
        } catch {
          expression = 'Error';
        }
      } else if (expression === 'Error') {
        expression = key === 'decimal' ? '0.' : key;
      } else {
        expression += key === 'operator' ? event.target.textContent : key;
      }
      display.value = expression || '0';
    });
  },

  paint(win) {
    const canvas = win.querySelector('.paint-canvas');
    const ctx = canvas.getContext('2d');
    const color = win.querySelector('.paint-color');
    const size = win.querySelector('.paint-size');
    let painting = false;

    const toXY = (event) => {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
    };

    canvas.addEventListener('pointerdown', (event) => {
      painting = true;
      canvas.setPointerCapture(event.pointerId);
      ctx.beginPath();
      ctx.moveTo(...toXY(event));
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!painting) return;
      ctx.lineTo(...toXY(event));
      ctx.stroke();
    });
    canvas.addEventListener('pointerup', () => { painting = false; });

    const setBrush = () => {
      ctx.strokeStyle = color.value;
      ctx.lineWidth = size.value;
      ctx.lineCap = ctx.lineJoin = 'round';
    };
    color.addEventListener('input', setBrush);
    size.addEventListener('input', setBrush);
    setBrush();

    win.querySelector('.paint-clear').addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));
    win.querySelector('.paint-save').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'orbit-drawing.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  },

  clock(win) {
    const tick = () => {
      const now = new Date();
      win.querySelector('.clock-time').textContent = now.toLocaleTimeString([], { hour12: false });
      win.querySelector('.clock-date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      win.querySelector('.clock-zone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    };
    tick();
    const timer = setInterval(tick, 1000);
    win.cleanup.push(() => clearInterval(timer));
  },

  game(win) {
    const target = win.querySelector('.game-target');
    const scoreLabel = win.querySelector('.game-score strong');
    const startButton = win.querySelector('.game-start');
    let score = 0;
    let playing = false;
    let timer;

    const moveTarget = () => {
      target.style.left = `${8 + Math.random() * 76}%`;
      target.style.top = `${8 + Math.random() * 70}%`;
    };

    startButton.addEventListener('click', () => {
      score = 0;
      playing = true;
      scoreLabel.textContent = score;
      startButton.textContent = 'Restart game';
      moveTarget();
      clearTimeout(timer);
      timer = setTimeout(() => { playing = false; startButton.textContent = 'Play again'; }, 30000);
    });
    target.addEventListener('click', () => {
      if (!playing) return;
      scoreLabel.textContent = ++score;
      moveTarget();
    });
    win.cleanup.push(() => clearTimeout(timer));
  },

  calendar(win) {
    const grid = win.querySelector('.calendar-grid');
    const label = win.querySelector('.calendar-month');
    let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const render = () => {
      const firstDay = month.getDay();
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const isToday = (day) =>
        day === new Date().getDate() && month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();
      label.textContent = month.toLocaleDateString([], { month: 'long', year: 'numeric' });
      grid.innerHTML =
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span class="calendar-weekday">${d}</span>`).join('') +
        '<span></span>'.repeat(firstDay) +
        Array.from({ length: days }, (_, i) => `<button class="calendar-day ${isToday(i + 1) ? 'today' : ''}">${i + 1}</button>`).join('');
    };

    win.querySelector('.calendar-prev').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); render(); });
    win.querySelector('.calendar-next').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); render(); });
    render();
  },

  snake(win) {
    const ctx = win.querySelector('.snake-canvas').getContext('2d');
    const scoreLabel = win.querySelector('.game-score strong');
    const startButton = win.querySelector('.game-start');
    const size = 16;
    let snake, food, direction, nextDirection, score, timer, playing;

    const draw = () => {
      ctx.fillStyle = '#04070d';
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = '#7ce8ff';
      snake.forEach((part) => ctx.fillRect(part.x * 20 + 2, part.y * 20 + 2, 16, 16));
      ctx.fillStyle = '#ff816b';
      ctx.fillRect(food.x * 20 + 2, food.y * 20 + 2, 16, 16);
    };

    const placeFood = () => {
      food = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
      if (snake.some((part) => part.x === food.x && part.y === food.y)) placeFood();
    };

    const end = () => {
      playing = false;
      clearInterval(timer);
      startButton.textContent = 'Play again';
    };

    const tick = () => {
      direction = nextDirection;
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size || snake.some((part) => part.x === head.x && part.y === head.y)) return end();
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        scoreLabel.textContent = ++score;
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    };

    const start = () => {
      snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      direction = { x: 1, y: 0 };
      nextDirection = direction;
      playing = true;
      score = 0;
      scoreLabel.textContent = 0;
      placeFood();
      startButton.textContent = 'Restart';
      clearInterval(timer);
      timer = setInterval(tick, 130);
      draw();
    };

    const keys = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
    };
    win.addEventListener('keydown', (event) => {
      const change = keys[event.key];
      if (!change || !playing || !(change.x !== -direction.x || change.y !== -direction.y)) return;
      event.preventDefault();
      nextDirection = change;
    });

    startButton.addEventListener('click', start);
    win.cleanup.push(() => clearInterval(timer));
    start();
  },

  minesweeper(win) {
    const grid = win.querySelector('.mines-grid');
    const status = win.querySelector('.mines-status');
    let mines, revealed, flags;

    const neighbors = (index) => {
      const x = index % 8;
      const y = Math.floor(index / 8);
      const found = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const inside = nx >= 0 && nx < 8 && ny >= 0 && ny < 8;
          if (inside && ny * 8 + nx !== index) found.push(ny * 8 + nx);
        }
      }
      return found;
    };

    const reveal = (index) => {
      if (flags.has(index) || revealed.has(index)) return;
      revealed.add(index);
      if (mines.has(index)) {
        status.textContent = 'Boom';
        mines.forEach((mine) => revealed.add(mine));
      } else if (!neighbors(index).some((n) => mines.has(n))) {
        neighbors(index).forEach((n) => { if (!revealed.has(n)) reveal(n); });
      }
      if (revealed.size >= 54) status.textContent = 'Cleared';
      render();
    };

    const render = () => {
      grid.innerHTML = '';
      for (let i = 0; i < 64; i++) {
        const cell = document.createElement('button');
        cell.className = 'mine-cell';
        cell.textContent = flags.has(i) ? '⚑' : '';
        if (revealed.has(i)) {
          cell.classList.add('revealed');
          if (mines.has(i)) cell.classList.add('mine-hit');
        }
        cell.addEventListener('click', () => reveal(i));
        cell.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          if (!revealed.has(i)) {
            flags.has(i) ? flags.delete(i) : flags.add(i);
            render();
          }
        });
        grid.append(cell);
      }
    };

    const reset = () => {
      mines = new Set();
      revealed = new Set();
      flags = new Set();
      while (mines.size < 10) mines.add(Math.floor(Math.random() * 64));
      status.textContent = 'Ready';
      render();
    };

    win.querySelector('.mines-reset').addEventListener('click', reset);
    reset();
  },

  camera(win) {
    const video = win.querySelector('.camera-preview');
    const status = win.querySelector('.camera-status');
    const snap = win.querySelector('.camera-snap');
    const snapshot = win.querySelector('.camera-snapshot');
    let stream;

    win.querySelector('.camera-start')?.addEventListener('click', async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        snap.disabled = false;
        status.textContent = 'Ready to capture.';
      } catch {
        status.textContent = 'Camera unavailable — check permissions.';
      }
    });

    snap?.addEventListener('click', () => {
      snapshot.width = video.videoWidth || 640;
      snapshot.height = video.videoHeight || 480;
      snapshot.getContext('2d').drawImage(video, 0, 0);
      snapshot.hidden = false;
      status.textContent = 'Snapshot captured locally.';
    });

    win.cleanup.push(() => stream?.getTracks().forEach((track) => track.stop()));
  },

  files(win) {
    const list = win.querySelector('.files-list');

    const render = () => {
      list.innerHTML = state.files
        .map((file, index) => `<div class="file-row"><button class="file-open" data-index="${index}">${file.name}</button><span class="file-type">${file.type}</span></div>`)
        .join('');
      list.querySelectorAll('.file-open').forEach((button) => {
        button.addEventListener('click', () => {
          const file = state.files[button.dataset.index];
          const updated = prompt(`Edit ${file.name}`, file.content);
          if (updated !== null) {
            file.content = updated;
            storage.set('orbit-files', JSON.stringify(state.files));
          }
        });
      });
    };

    win.querySelector('.new-file').addEventListener('click', () => {
      const name = prompt('New file name', 'untitled.txt');
      if (!name) return;
      state.files.push({ name, type: 'TEXT', content: '' });
      storage.set('orbit-files', JSON.stringify(state.files));
      render();
    });
    render();
  },

  terminal(win) {
    const form = win.querySelector('.terminal-input');
    const input = form.querySelector('input');
    const output = win.querySelector('.terminal-output');

    const print = (html) => {
      output.insertAdjacentHTML('beforeend', `<p>${html}</p>`);
      output.scrollTop = output.scrollHeight;
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const command = input.value.trim().toLowerCase();
      input.value = '';

      if (command === 'clear') { output.innerHTML = ''; return; }
      if (command === 'help') return print('help &nbsp; clear &nbsp; date &nbsp; about &nbsp; dora &nbsp; dora hide &nbsp; dora show &nbsp; dorayaki');
      if (command === 'date') return print(new Date().toString());
      if (command === 'about') return print('Orbit is a local-first web workspace.');
      if (command === 'dora' || command === 'doraemon') {
        window.doraSay?.("Doraemon here! Try 'dora hide' 💙", 3000);
        return print('Doraemon waved hello! Click him or type dora hide / dora show');
      }
      if (command === 'dora hide' || command === 'dora remove') {
        window.doraHide?.();
        return print('Doraemon hid — summon with dora show 💤');
      }
      if (command === 'dora show' || command === 'dora summon') {
        window.doraShow?.();
        return print('Doraemon is back! 💙');
      }
      if (command === 'dora nap') {
        const dora = document.querySelector('#doraemon');
        print('Doraemon napping 20s… 😴');
        window.doraSay?.('Shhh… nap time 😴', 2200);
        dora.style.opacity = '.28';
        dora.style.pointerEvents = 'none';
        setTimeout(() => {
          dora.style.opacity = '';
          dora.style.pointerEvents = '';
          window.doraSay?.('I’m back! 💙', 2600);
        }, 20000);
        return;
      }
      if (command === 'dorayaki') {
        window.doraSay?.('Yum yum dorayaki! 🥞 Thanks!', 2600);
        return print('🥞 *doraemon munches dorayaki* delicious! Try clicking him!');
      }
      if (command) print(`Command not found: ${command}`);
    });
  },

  browser(win) {
    const frame = win.querySelector('.browser-frame');
    const input = win.querySelector('.address-input');

    const navigate = () => {
      let address = input.value.trim();
      if (!address) return;
      if (!/^https?:\/\//i.test(address)) address = `https://${address}`;
      const url = validateUrl(address);
      if (!url) return;
      input.value = url;
      frame.src = url;
    };

    win.querySelector('.address-submit')?.addEventListener('click', navigate);
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        navigate();
      }
    });
    win.querySelector('.browser-back')?.addEventListener('click', () => { try { frame.contentWindow.history.back(); } catch {} });
    win.querySelector('.browser-forward')?.addEventListener('click', () => { try { frame.contentWindow.history.forward(); } catch {} });
    win.querySelector('.browser-reload')?.addEventListener('click', () => { try { frame.contentWindow.location.reload(); } catch {} });
    win.querySelector('.external-link')?.addEventListener('click', () => {
      const url = input.value.trim();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
  },

  random(win) {
    const output = win.querySelector('.random-output');
    const pick = (max) => Math.floor(Math.random() * max) + 1;
    const randomColor = () => `hsl(${pick(360)} 70% 70%)`;

    win.querySelector('.random-style').addEventListener('click', () => {
      ['--lime', '--coral', '--blue'].forEach((name) => document.documentElement.style.setProperty(name, randomColor()));
      output.textContent = 'Three interface colors randomized.';
    });
    win.querySelector('.random-number').addEventListener('click', () => {
      output.textContent = `Random value: ${pick(10000).toLocaleString()}`;
    });
    win.querySelector('.random-data').addEventListener('click', () => {
      const started = performance.now();
      const records = Array.from({ length: 10000 }, (_, index) => ({ id: index + 1, value: pick(10000) }));
      const total = records.reduce((sum, record) => sum + record.value, 0);
      output.textContent = `Generated ${records.length.toLocaleString()} records, total ${total.toLocaleString()} in ${(performance.now() - started).toFixed(1)} ms.`;
    });
    win.querySelector('.random-custom').addEventListener('submit', (event) => {
      event.preventDefault();
      const max = Math.max(1, Math.min(1000000, Number(event.currentTarget.querySelector('input').value) || 10000));
      output.textContent = `Random value from 1-${max.toLocaleString()}: ${pick(max).toLocaleString()}`;
    });
  },
};

function openApp(appId) {
  launcherPanel.hidden = true;

  // social apps open inside the built-in browser instead
  if (apps[appId]?.externalUrl) {
    openApp('browser');
    const browserWin = openWindows.get('browser');
    const url = validateUrl(apps[appId].externalUrl);
    if (browserWin && url) {
      const input = browserWin.querySelector('.address-input');
      if (input) input.value = url;
      browserWin.querySelector('.browser-frame').src = url;
      browserWin.style.zIndex = ++highestZ;
    }
    return;
  }

  if (openWindows.has(appId)) {
    openWindows.get(appId).style.zIndex = ++highestZ;
    return;
  }
  const app = apps[appId];
  if (!app) return;

  const win = document.createElement('article');
  win.className = 'window';
  win.cleanup = [];
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', app.title);
  win.style.transform = `translate(calc(-50% + ${openWindows.size * 28}px), ${openWindows.size * 24}px)`;
  win.style.zIndex = ++highestZ;
  win.innerHTML = `<header class="window-header"><span class="window-title">${app.title}</span><span class="window-actions"><button class="minimize-window" aria-label="Minimize ${app.title}">−</button><button class="maximize-window" aria-label="Maximize ${app.title}">□</button><button class="close-window" aria-label="Close ${app.title}">×</button></span></header><div class="window-content">${app.content}</div>`;
  windowLayer.append(win);
  openWindows.set(appId, win);
  updateOpenCount();

  const trayButton = document.createElement('button');
  trayButton.className = 'tray-item';
  trayButton.textContent = app.title;
  trayButton.addEventListener('click', () => { win.hidden = false; win.style.zIndex = ++highestZ; });
  windowTray.append(trayButton);

  const closeWindow = () => {
    win.cleanup.forEach((fn) => fn());
    win.remove();
    trayButton.remove();
    openWindows.delete(appId);
    updateOpenCount();
  };

  win.addEventListener('pointerdown', () => { win.style.zIndex = ++highestZ; });
  win.querySelector('.close-window').addEventListener('click', closeWindow);
  win.querySelector('.minimize-window').addEventListener('click', () => { win.hidden = true; });
  const maximizeButton = win.querySelector('.maximize-window');
  maximizeButton.addEventListener('click', () => {
    const maximized = win.classList.toggle('is-maximized');
    maximizeButton.textContent = maximized ? '❐' : '□';
  });

  makeDraggable(win);
  mounts[appId]?.(win);
}
function makeDraggable(windowElement) {
  const header = windowElement.querySelector('.window-header');
  let startX, startY, startLeft, startTop;
  header.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    const rect = windowElement.getBoundingClientRect();
    startX = event.clientX; startY = event.clientY; startLeft = rect.left; startTop = rect.top;
    header.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const nextLeft = Math.max(16, Math.min(startLeft + moveEvent.clientX - startX, window.innerWidth - windowElement.offsetWidth - 16));
      const nextTop = Math.max(70, Math.min(startTop + moveEvent.clientY - startY, window.innerHeight - 90));
      windowElement.style.left = `${nextLeft}px`;
      windowElement.style.top = `${nextTop}px`;
      windowElement.style.transform = 'none';
    };
    const stop = () => { header.removeEventListener('pointermove', move); header.removeEventListener('pointerup', stop); header.releasePointerCapture(event.pointerId); };
    header.addEventListener('pointermove', move);
    header.addEventListener('pointerup', stop);
  });
}

desktop.addEventListener('click', (event) => {
  const appButton = event.target.closest('[data-app]');
  if (appButton) openApp(appButton.dataset.app);
  if (event.target.closest('#launcherButton, #brandButton')) toggleLauncher();
});
const launcherSearch = document.querySelector('#launcherSearch');
launcherSearch.addEventListener('input', () => {
  const query = launcherSearch.value.toLowerCase();
  launcherPanel.querySelectorAll('[data-app]').forEach((button) => { button.hidden = !button.textContent.toLowerCase().includes(query); });
});
const dockSearch = document.querySelector('#dockSearch');
const dockSearchResults = document.querySelector('#dockSearchResults');
dockSearch.addEventListener('input', () => {
  const query = dockSearch.value.trim().toLowerCase();
  if (query) launcherPanel.hidden = true;
  const matches = Object.entries(apps).filter(([, app]) => app.title.toLowerCase().includes(query));
  dockSearchResults.replaceChildren(...matches.map(([appId, app]) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.app = appId; button.setAttribute('role', 'option'); button.textContent = app.title; button.addEventListener('click', () => { openApp(appId); dockSearch.value = ''; dockSearch.dispatchEvent(new Event('input')); }); return button; }));
  dockSearchResults.hidden = !query || matches.length === 0;
});
function launchDockSearchMatch() { const firstMatch = [...document.querySelectorAll('.dock-search-results button')][0]; if (firstMatch) firstMatch.click(); }
dockSearch.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); launchDockSearchMatch(); } });
document.querySelector('#dockSearchForm').addEventListener('submit', (event) => { event.preventDefault(); launchDockSearchMatch(); });
dockSearch.addEventListener('blur', () => { setTimeout(() => { dockSearchResults.hidden = true; }, 120); });
launcherPanel.addEventListener('click', (event) => {
  event.stopPropagation();
  const appButton = event.target.closest('[data-app]');
  if (appButton) openApp(appButton.dataset.app);
});
function toggleLauncher() {
  launcherPanel.hidden = !launcherPanel.hidden;
  if (!launcherPanel.hidden) { launcherSearch.value = ''; launcherPanel.querySelectorAll('[data-app]').forEach((button) => { button.hidden = false; }); launcherSearch.focus(); }
}
document.querySelectorAll('.theme-choice').forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.theme)));
document.querySelector('#themeButton').addEventListener('click', () => setTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));
document.querySelector('#focusButton').addEventListener('click', (event) => {
  const enabled = desktop.classList.toggle('focus-mode');
  event.currentTarget.setAttribute('aria-pressed', String(enabled));
  event.currentTarget.innerHTML = `<span>${enabled ? '◑' : '◒'}</span> ${enabled ? 'Exit focus' : 'Focus mode'}`;
});
document.querySelector('#shuffleButton').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const colors = moodColors[Math.floor(Math.random() * moodColors.length)];
  ['--lime', '--coral', '--blue'].forEach((name, index) => document.documentElement.style.setProperty(name, colors[index]));
  storage.set('orbit-mood', JSON.stringify(colors));
  button.innerHTML = '<span>✓</span> Mood shuffled';
  setTimeout(() => { button.innerHTML = '<span>✦</span> Shuffle mood'; }, 1400);
});
document.querySelector('#closeAllButton').addEventListener('click', () => {
  [...openWindows.values()].forEach((windowElement) => windowElement.querySelector('.close-window').click());
});

// — tiny easter egg: click O five times fast —
(function brandEgg(){
  const brand = document.querySelector('#brandButton');
  if(!brand) return;
  let clicks=0, timer;
  brand.addEventListener('click', ()=>{
    clicks+=1; clearTimeout(timer);
    timer=setTimeout(()=> clicks=0, 1400);
    if(clicks>=5){
      clicks=0;
      if(window.anime){
        anime({ targets: '.brand-mark', rotate: [0, 360], scale: [.9,1.15,.95,1], duration: 700, easing:'easeOutBack' });
        anime({ targets: '.dock-item', translateY: [-6,0], delay: anime.stagger(30), duration: 500, easing:'easeOutBack' });
      }
    }
  });
})();document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { launcherPanel.hidden = true; if (typeof hideTooltip==='function') hideTooltip(); }
  if (event.ctrlKey && event.code === 'Space') { event.preventDefault(); toggleLauncher(); }
});
function updateNetworkStatus() {
  const online = navigator.onLine;
  document.querySelector('#networkStatus').textContent = online ? 'Connected' : 'Offline';
  document.querySelector('.status-dot').classList.toggle('offline', !online);
}
function updateClock() { document.querySelector('#clock').textContent = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date()); }
function updateOpenCount() { document.querySelector('#openCount').textContent = `${openWindows.size} OPEN`; }
function updateStatusDate() {
  const now = new Date();
  document.querySelector('#statusGreeting').textContent = `${now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'}.`;
  document.querySelector('#statusDate').textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
// — human touches: uptime ticker —
const _bootAt = Date.now();
function updateUptime() {
  const el = document.querySelector('#uptime');
  if (!el) return;
  const mins = Math.floor((Date.now() - _bootAt) / 60000);
  if (mins < 1) el.textContent = 'up just now';
  else if (mins === 1) el.textContent = 'up 1 min';
  else if (mins < 60) el.textContent = `up ${mins} mins`;
  else el.textContent = `up ${Math.floor(mins/60)}h ${mins%60}m`;
}
setInterval(updateUptime, 30000);
updateUptime();

// — square cloud tooltip for app icons (desktop + dock) —
const appTooltip = document.querySelector('#appTooltip');
const appMeta = {
  notes: { tag: 'MAKE', title: 'Notes', desc: 'Jot down a thought before it drifts. Auto-saves.' },
  files: { tag: 'MAKE', title: 'Files', desc: 'Your tiny workspace — create, edit, keep.' },
  terminal: { tag: 'MAKE', title: 'Terminal', desc: 'Orbit Terminal 1.0 — try help, date, dora.' },
  about: { tag: 'CONNECT', title: 'About Orbit', desc: 'The story behind this hand-rolled OS.' },
  browser: { tag: 'TOOLS', title: 'Orbit Browser', desc: 'A lil’ browser inside the OS. Back / forward work!' },
  calculator: { tag: 'TOOLS', title: 'Calculator', desc: 'Do the math — click or type.' },
  paint: { tag: 'MAKE', title: 'Paint', desc: 'Sketch, save as PNG. No AI, just you.' },
  clock: { tag: 'TOOLS', title: 'Clock', desc: 'Local time, ticking live.' },
  game: { tag: 'PLAY', title: 'Orbit Dash', desc: 'Catch the ◆ — 30 seconds chaos.' },
  calendar: { tag: 'TOOLS', title: 'Calendar', desc: 'Flip months, spot today.' },
  snake: { tag: 'PLAY', title: 'Snake', desc: 'WASD / arrows — don’t hit yourself!' },
  minesweeper: { tag: 'PLAY', title: 'Minesweeper', desc: 'Right-click to flag. 10 mines.' },
  camera: { tag: 'PLAY', title: 'Camera', desc: 'Go live — snapshot stays local.' },
  instagram: { tag: 'CONNECT', title: 'Instagram', desc: 'Opens in new tab — your feed awaits.' },
  whatsapp: { tag: 'CONNECT', title: 'WhatsApp', desc: 'WhatsApp Web — chat without leaving orbit.' },
  youtube: { tag: 'CONNECT', title: 'YouTube', desc: 'YouTube — because why not.' },
  random: { tag: 'SYSTEM', title: 'Random Lab', desc: 'Generate noise, shuffle colors, go wild.' }
};
let tooltipTimer;
function positionTooltip(target) {
  const rect = target.getBoundingClientRect();
  const tip = appTooltip;
  tip.style.left = (rect.left + rect.width/2) + 'px';
  // place above icon, but if near top, place below
  const above = rect.top > 140;
  tip.style.top = above ? (rect.top - 10) + 'px' : (rect.bottom + 12) + 'px';
  tip.style.transformOrigin = above ? '50% 100%' : '50% 0%';
  tip.querySelector('.cloud-arrow').style.top = above ? 'auto' : '-6px';
  tip.querySelector('.cloud-arrow').style.bottom = above ? '-6px' : 'auto';
  tip.querySelector('.cloud-arrow').style.transform = above ? 'translateX(-50%) rotate(45deg)' : 'translateX(-50%) rotate(225deg)';
  tip.style.transform = above ? 'translate(-50%, -100%) rotate(-0.4deg) scale(1)' : 'translate(-50%, 0) rotate(0.2deg) scale(1)';
}
function showTooltip(target) {
  const appId = target.dataset.app || target.getAttribute('data-app');
  if (!appId || !appMeta[appId] || window.matchMedia('(max-width: 700px)').matches) return;
  const meta = appMeta[appId];
  appTooltip.querySelector('.cloud-title').textContent = meta.title;
  appTooltip.querySelector('.cloud-tag').textContent = meta.tag;
  appTooltip.querySelector('.cloud-desc').textContent = meta.desc;
  // color dot by group
  const dot = appTooltip.querySelector('.cloud-dot');
  const tagColors = { MAKE: '#d4f36a', TOOLS: '#94bff5', PLAY: '#ff816b', CONNECT: '#e6a8d7', SYSTEM: '#a9d8e5' };
  dot.style.background = tagColors[meta.tag] || '#d4f36a';
  positionTooltip(target);
  appTooltip.hidden = false;
  requestAnimationFrame(() => appTooltip.classList.add('is-visible'));
  // subtle pop via anime if available
  if (window.anime) anime({ targets: appTooltip, scale: [.96,1], duration: 260, easing: 'easeOutBack' });
}
function hideTooltip() {
  if (!appTooltip) return;
  appTooltip.classList.remove('is-visible');
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => { appTooltip.hidden = true; }, 180);
}
document.querySelectorAll('.dock-item[data-app]').forEach(el => {
  el.addEventListener('mouseenter', () => { clearTimeout(tooltipTimer); showTooltip(el); });
  el.addEventListener('mouseleave', hideTooltip);
  el.addEventListener('focus', () => showTooltip(el));
  el.addEventListener('blur', hideTooltip);
  // hide on click
  el.addEventListener('click', hideTooltip);
});
desktop.addEventListener('scroll', hideTooltip, true);
window.addEventListener('scroll', hideTooltip, true);

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();
updateClock();
updateOpenCount();
updateStatusDate();
setInterval(updateClock, 30000);

// ── Doraemon — patrolling and teasing ──
(function initDoraemon(){
  const dora = document.querySelector('#doraemon');
  const bubble = document.querySelector('#doraBubble');
  const bubbleText = bubble?.querySelector('.dora-bubble-text');
  const bubbleClose = bubble?.querySelector('.dora-bubble-close');
  if (!dora || !bubble) return;
  let x = Math.max(12, window.innerWidth * 0.22);
  let dir = 1;
  let speed = 0.9;
  let isPaused = false;
  let rafId = null;
  let mischiefTimer = null;
  let blinkTimer = null;
  let idleTimer = null;
  const doraW = 74;
  const phrases = [
    "A day on Venus is longer than its year. 🪐",
    "Neutron stars can spin 600 times a second.",
    "This black hole? 6.5 billion suns heavy. 🕳️",
    "Space is completely silent — no air out here.",
    "A million Earths could fit inside the Sun.",
    "Sunlight takes 8 minutes 20 seconds to reach you.",
    "Don't forget to save Notes — I did! ✦",
    "There's a space water cloud 140 trillion× Earth's oceans.",
    "Olympus Mons on Mars is 3× taller than Everest.",
    "Saturn is less dense than water — it would float!",
    "Moon footprints last millions of years. 🌙",
    "Jupiter's Red Spot is a storm bigger than Earth.",
    "Falling into a black hole is called spaghettification.",
    "The M87 photo took 8 telescopes and 2 years of data."
  ];
  const mischiefActs = [
    () => {
      showBubble("Hehe — I nudged your window! 😜", 2600);
      const wins = [...openWindows.values()];
      if (wins.length) {
        const w = wins[Math.floor(Math.random()*wins.length)];
        const dx = (Math.random()-0.5)*40, dy=(Math.random()-0.5)*24;
        const curL = parseFloat(w.style.left)|| (window.innerWidth/2 - 250);
        const curT = parseFloat(w.style.top)|| 120;
        w.style.transition='transform .35s cubic-bezier(.34,1.56,.64,1), left .35s, top .35s';
        w.style.left = Math.max(12, Math.min(window.innerWidth - w.offsetWidth - 12, curL + dx)) + 'px';
        w.style.top  = Math.max(70, Math.min(window.innerHeight - 120, curT + dy)) + 'px';
        w.style.transform='none rotate(-0.6deg)';
        setTimeout(()=>{ w.style.transition=''; w.style.transform='none'; }, 420);
        if (window.anime) anime({ targets: w, scale:[1,1.03,1], duration:320, easing:'easeInOutSine' });
      } else {
        // if no windows, wobble dock
        if (window.anime) anime({ targets: '.dock', translateY: [-4,0], duration: 420, easing:'easeOutBack' });
      }
    },
    () => {
      showBubble("Dorayaki rain! 🥞✨", 2400);
      for(let i=0;i<5;i++){ setTimeout(()=> dropDorayaki(), i*120); }
    },
    () => {
      showBubble("Psst — I hid the search for a sec! 🔍", 2500);
      const s = document.querySelector('#dockSearch');
      if(s){ s.placeholder='Doraemon was here! 😆'; setTimeout(()=> s.placeholder='Search apps...', 2200); if(window.anime) anime({ targets: s.parentElement, scale:[1,.97,1], duration: 420 }); }
    },
    () => {
      showBubble("Tada! Colour shuffle — you’re welcome! 🎨", 2600);
      const btn = document.querySelector('#shuffleButton');
      if(btn) btn.click();
    },
    () => {
      showBubble("I’m sleepy… zzz… just kidding! 😆", 2600);
      dora.classList.add('is-blinking');
      setTimeout(()=> dora.classList.remove('is-blinking'), 1200);
      dora.style.filter='brightness(0.96)';
      setTimeout(()=> dora.style.filter='', 900);
    }
  ];
  function maxX(){ return Math.max(12, window.innerWidth - doraW - 12); }
  function placeBubble(){
    const r = dora.getBoundingClientRect();
    let bx = r.left + r.width/2;
    let by = r.top - 10;
    // keep inside viewport
    bx = Math.max(100, Math.min(window.innerWidth - 100, bx));
    bubble.style.left = bx + 'px';
    bubble.style.top  = (r.top > 140 ? by : r.bottom + 14) + 'px';
    bubble.style.transform = r.top > 140 ? 'translate(-50%, -100%) rotate(-0.6deg)' : 'translate(-50%, 0) rotate(-0.6deg)';
    bubble.querySelector('.dora-bubble-tail').style.left = '50%';
    bubble.querySelector('.dora-bubble-tail').style.bottom = r.top > 140 ? '-7px' : 'auto';
    bubble.querySelector('.dora-bubble-tail').style.top = r.top > 140 ? 'auto' : '-7px';
    bubble.querySelector('.dora-bubble-tail').style.transform = r.top > 140 ? 'translateX(-50%) rotate(45deg)' : 'translateX(-50%) rotate(225deg)';
  }
  function showBubble(text, ms=3200){
    if(!text) return;
    bubbleText.textContent = text;
    bubble.hidden = false;
    placeBubble();
    // auto hide
    clearTimeout(bubble._hide);
    bubble._hide=setTimeout(hideBubble, ms);
  }
  function hideBubble(){
    bubble.hidden = true;
    clearTimeout(bubble._hide);
  }
  bubbleClose?.addEventListener('click', (e)=>{ e.stopPropagation(); hideBubble(); });
  function doJump(){
    dora.classList.remove('is-jumping'); void dora.offsetWidth;
    const sx = dir;
    dora.style.setProperty('--sx', sx);
    dora.classList.add('is-jumping');
    setTimeout(()=> dora.classList.remove('is-jumping'), 560);
  }
  function dropDorayaki(){
    const el = document.createElement('div');
    el.textContent = Math.random() > .5 ? '🥞' : '✨';
    el.style.position='fixed';
    const rx = dora.getBoundingClientRect();
    el.style.left = (rx.left + rx.width/2 + (Math.random()-0.5)*30) + 'px';
    el.style.top  = (rx.top - 6) + 'px';
    el.style.fontSize = '18px';
    el.style.pointerEvents='none';
    el.style.zIndex='12';
    el.style.filter='drop-shadow(1px 2px 0 rgba(0,0,0,.18))';
    document.body.appendChild(el);
    if(window.anime){
      anime({ targets: el, translateY: [0, 44 + Math.random()*20], translateX: [(Math.random()-0.5)*40], rotate: [0, (Math.random()-0.5)*80], opacity:[1,0], duration: 900+Math.random()*300, easing:'easeInQuad', complete:()=> el.remove() });
    } else {
      el.animate([{ transform:'translateY(0)', opacity:1},{ transform:'translateY(44px)', opacity:0}], {duration:900, easing:'ease-in'}).onfinish=()=>el.remove();
    }
  }
  function patrol(){
    if(isPaused) { rafId=requestAnimationFrame(patrol); return; }
    if(Math.random() < 0.006){ isPaused=true; dora.classList.remove('is-walking'); setTimeout(()=>{ isPaused=false; dora.classList.add('is-walking'); }, 900 + Math.random()*900); }
    if(Math.random() < 0.004){ dir *= -1; }
    x += dir * speed;
    if(x < 12){ x=12; dir=1; }
    if(x > maxX()){ x=maxX(); dir=-1; }
    dora.style.left = x + 'px';
    dora.style.setProperty('--sx', dir);
    if(dir===1) dora.classList.remove('is-facing-left'); else dora.classList.add('is-facing-left');
    // waddle bob handled via is-walking foot animation; keep walking class
    if(!dora.classList.contains('is-walking') && !isPaused) dora.classList.add('is-walking');
    // keep bubble attached if visible
    if(!bubble.hidden) placeBubble();
    rafId=requestAnimationFrame(patrol);
  }
  function scheduleMischief(){
    clearTimeout(mischiefTimer);
    mischiefTimer=setTimeout(()=>{ const act=mischiefActs[Math.floor(Math.random()*mischiefActs.length)]; try{act();}catch{} scheduleMischief(); }, 11000 + Math.random()*9000);
  }
  function scheduleBlink(){
    clearTimeout(blinkTimer);
    blinkTimer=setTimeout(()=>{ dora.classList.add('is-blinking'); setTimeout(()=> dora.classList.remove('is-blinking'), 140); scheduleBlink(); }, 2600 + Math.random()*3200);
  }
  // interactions
  dora.addEventListener('click', (e)=>{
    e.stopPropagation();
    doJump();
    const p = phrases[Math.floor(Math.random()*phrases.length)];
    showBubble(p, 3400);
    dropDorayaki();
    if(window.anime) anime({ targets: dora, scale:[1,1.08,1], duration:320, easing:'easeOutBack' });
  });
  dora.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); dora.click(); }
  });
  // drag to move (fun: pick him up)
  let dragging=false, dragOffX=0;
  dora.addEventListener('pointerdown', (e)=>{
    dragging=true; dora.setPointerCapture(e.pointerId);
    const r=dora.getBoundingClientRect();
    dragOffX = e.clientX - r.left;
    isPaused=true; dora.classList.remove('is-walking');
    dora.style.transition='none';
    hideBubble();
  });
  dora.addEventListener('pointermove', (e)=>{
    if(!dragging) return;
    x = Math.max(12, Math.min(maxX(), e.clientX - dragOffX));
    dora.style.left = x + 'px';
    dir = e.movementX > 0 ? 1 : e.movementX < 0 ? -1 : dir;
    if(dir===1) dora.classList.remove('is-facing-left'); else dora.classList.add('is-facing-left');
    dora.style.setProperty('--sx', dir);
    placeBubble();
  });
  const stopDrag=(e)=>{ dragging=false; isPaused=false; dora.style.transition=''; dora.classList.add('is-walking'); try{ dora.releasePointerCapture(e.pointerId);}catch{}; if(Math.random()<0.5) showBubble("Wee! Thanks for the lift! 🤗", 2400); };
  dora.addEventListener('pointerup', stopDrag);
  dora.addEventListener('pointercancel', stopDrag);
  // hide bubble when clicking elsewhere
  document.addEventListener('click', (e)=>{ if(!e.target.closest('#doraemon') && !e.target.closest('#doraBubble')) hideBubble(); });
  desktop.addEventListener('click', (e)=>{
    // if click on empty desktop near dora, dora looks
    if(e.target===desktop || e.target.closest('.desktop-content')){
      const cx=e.clientX;
      if(Math.abs(cx - (x + doraW/2)) < 220){
        dir = cx > x ? 1 : -1;
        if(dir===1) dora.classList.remove('is-facing-left'); else dora.classList.add('is-facing-left');
        dora.style.setProperty('--sx', dir);
        showBubble("You called? I'm coming! 💨", 2200);
        // toddle toward click a bit
        const target = Math.max(12, Math.min(maxX(), cx - doraW/2));
        if(window.anime && Math.abs(target - x) > 30){
          isPaused=true;
          anime({ targets: dora, left: [x, target], duration: 700, easing:'easeInOutSine', update:()=>{ x=parseFloat(dora.style.left); if(!bubble.hidden) placeBubble(); }, complete:()=>{ x=target; isPaused=false; doJump(); }});
        }
      }
    }
  });
  // context menu — nap
  dora.addEventListener('contextmenu', (e)=>{
    e.preventDefault();
    doNap(20000);
  });
  function doNap(ms=20000){
    showBubble("Shhh… nap time for " + Math.round(ms/1000) + "s 😴", 2200);
    dora.style.opacity='.28'; dora.style.pointerEvents='none';
    isPaused=true;
    setTimeout(()=>{ dora.style.opacity=''; dora.style.pointerEvents=''; isPaused=false; showBubble("I’m back! Did you miss me? 💙", 2600); doJump(); }, ms);
  }
  // — hide / remove option with persistence — now on toolbar (dock) —
  const summonBtn = document.querySelector('#doraSummon');
  const toggleBtn = document.querySelector('#doraToggleButton');
  const dockToggle = document.querySelector('#doraDockToggle');
  function syncToggles(visible){
    const icon = visible ? '●' : '○';
    if(toggleBtn){
      toggleBtn.setAttribute('aria-pressed', String(visible));
      toggleBtn.innerHTML = visible ? '<span>D</span> Doraemon' : '<span>D</span> Doraemon ✕';
      toggleBtn.title = visible ? 'Hide Doraemon' : 'Show Doraemon';
    }
    if(dockToggle){
      dockToggle.setAttribute('aria-pressed', String(visible));
      dockToggle.setAttribute('aria-label', visible ? 'Hide Doraemon' : 'Show Doraemon');
      dockToggle.title = visible ? 'Hide Doraemon — toolbar' : 'Show Doraemon — toolbar';
      dockToggle.querySelector('.dora-dock-icon').textContent = visible ? '●' : '○';
      dockToggle.style.opacity = visible ? '1' : '.62';
    }
  }
  function setDoraVisible(visible, opts={}){
    const persist = opts.persist !== false;
    if(visible){
      dora.classList.remove('is-hidden');
      dora.style.display='';
      dora.hidden=false;
      if(summonBtn) summonBtn.hidden=true;
      bubble.hidden=true;
      isPaused=false;
      if(!opts.silent) showBubble("I’m back! Let’s play! 💙", 3000);
      syncToggles(true);
      if(persist) storage.set('orbit-dora-hidden','0');
      scheduleMischief();
    } else {
      if(!opts.silent) showBubble("Bye! Use toolbar to summon me! 👋<br><span style='font-size:9px;opacity:.7'>Dock → ● button</span>", 2600);
      setTimeout(()=>{
        dora.classList.add('is-hidden');
        dora.hidden=true;
        bubble.hidden=true;
        if(summonBtn) summonBtn.hidden=false;
        isPaused=true;
        clearTimeout(mischiefTimer);
        syncToggles(false);
        if(persist) storage.set('orbit-dora-hidden','1');
      }, opts.silent ? 0 : 420);
    }
  }
  summonBtn?.addEventListener('click', ()=> setDoraVisible(true));
  const handleToggle = ()=>{
    const currentlyVisible = !dora.classList.contains('is-hidden') && !dora.hidden && dora.style.display!=='none' && storage.get('orbit-dora-hidden')!=='1';
    setDoraVisible(!currentlyVisible);
  };
  toggleBtn?.addEventListener('click', handleToggle);
  dockToggle?.addEventListener('click', handleToggle);
  // init from storage
  const wasHidden = storage.get('orbit-dora-hidden')==='1';
  if(wasHidden){
    setDoraVisible(false, {silent:true, persist:false});
    syncToggles(false);
    if(summonBtn) summonBtn.hidden=false;
  } else {
    syncToggles(true);
  }
  // init
  dora.style.left = x + 'px';
  if(!wasHidden) dora.classList.add('is-walking');
  patrol();
  scheduleMischief();
  scheduleBlink();
  // welcome only if visible
  if(!wasHidden) setTimeout(()=> showBubble("Hey Saksh! I’m floating near the event horizon — click me for space facts! 💙<br><span style='opacity:.7;font-size:9px'>Hide me via dock ● — Right-click for nap</span>", 4200), 1200);
  window.addEventListener('resize', ()=>{ x=Math.min(x, maxX()); dora.style.left=x+'px'; });
  // expose for terminal
  window.doraSay = showBubble;
  window.doraHide = ()=> setDoraVisible(false);
  window.doraShow = ()=> setDoraVisible(true);
  window.doraToggle = ()=> {
    const vis = !dora.classList.contains('is-hidden') && !dora.hidden;
    setDoraVisible(!vis);
  };
})();
if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  anime({ targets: '.dock-item', translateY: [14, 0], scale: [.96, 1], delay: anime.stagger(35), duration: 700, easing: 'easeOutCubic' });
  anime({ targets: '.blackhole-img', scale: [1, 1.06], duration: 24000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.stars', opacity: [.55, .95], duration: 4200, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
}
