const desktop = document.querySelector('#desktop');
const windowLayer = document.querySelector('#windowLayer');
const launcherPanel = document.querySelector('#launcherPanel');
const windowTray = document.querySelector('#windowTray');
const openWindows = new Map();
let highestZ = 5;
const storage = {
  get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable for local files. */ } }
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

const wallpaperCustom = document.querySelector('#wallpaperCustom');
const wallpaperDim = document.querySelector('#wallpaperDim');
const wallpaperPresets = [
  { id: 'default', name: 'ORBIT', preview: 'linear-gradient(180deg, #a9d5dc 0%, #d8e8dc 62%, #98c09b 100%)', type: 'default', value: '' },
  { id: 'sunset', name: 'SUNSET', preview: 'linear-gradient(135deg,#ff9a8b 0%,#ff6a88 30%,#d76d77 60%,#3a1c71 100%)', type: 'gradient', value: 'linear-gradient(135deg,#ff9a8b 0%,#ff6a88 30%,#d76d77 60%,#3a1c71 100%)' },
  { id: 'aurora', name: 'AURORA', preview: 'linear-gradient(135deg,#0f2027 0%,#203a43 45%,#2c5364 100%)', type: 'gradient', value: 'linear-gradient(135deg,#0f2027 0%,#203a43 45%,#2c5364 100%)' },
  { id: 'pastel', name: 'PASTEL', preview: 'linear-gradient(135deg,#fdfcfb 0%,#e2d1c9 100%)', type: 'gradient', value: 'linear-gradient(135deg,#fdfcfb 0%,#e2d1c9 100%)' },
  { id: 'midnight', name: 'MIDNIGHT', preview: 'linear-gradient(135deg,#141e30 0%,#243b55 100%)', type: 'gradient', value: 'linear-gradient(135deg,#141e30 0%,#243b55 100%)' },
  { id: 'moss', name: 'MOSS', preview: 'linear-gradient(135deg,#134e5e 0%,#71b280 100%)', type: 'gradient', value: 'linear-gradient(135deg,#134e5e 0%,#71b280 100%)' },
  { id: 'peach', name: 'PEACH', preview: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)', type: 'gradient', value: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)' },
  { id: 'dusk', name: 'DUSK', preview: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', type: 'gradient', value: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' },
  { id: 'mountain', name: 'ALPS', preview: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop")', type: 'image', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&auto=format&fit=crop' },
  { id: 'city', name: 'CITY', preview: 'url("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80&auto=format&fit=crop")', type: 'image', value: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80&auto=format&fit=crop' },
  { id: 'ocean', name: 'OCEAN', preview: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80&auto=format&fit=crop")', type: 'image', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&auto=format&fit=crop' },
  { id: 'forest', name: 'FOREST', preview: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80&auto=format&fit=crop")', type: 'image', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80&auto=format&fit=crop' }
];

function readStoredWallpaper() {
  try { const raw = storage.get('orbit-wallpaper', null); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
const wallpaperState = (() => {
  const stored = readStoredWallpaper();
  if (stored && typeof stored === 'object') {
    return {
      type: stored.type || 'default',
      value: stored.value || '',
      fit: stored.fit || 'cover',
      blur: Number.isFinite(stored.blur) ? stored.blur : 0,
      dim: Number.isFinite(stored.dim) ? stored.dim : 0,
      presetId: stored.presetId || null
    };
  }
  return { type: 'default', value: '', fit: 'cover', blur: 0, dim: 0, presetId: 'default' };
})();

function applyWallpaper(next) {
  const cfg = next || wallpaperState;
  wallpaperState.type = cfg.type;
  wallpaperState.value = cfg.value;
  wallpaperState.fit = cfg.fit || 'cover';
  wallpaperState.blur = Number.isFinite(cfg.blur) ? cfg.blur : 0;
  wallpaperState.dim = Number.isFinite(cfg.dim) ? cfg.dim : 0;
  wallpaperState.presetId = cfg.presetId || null;
  storage.set('orbit-wallpaper', JSON.stringify(wallpaperState));
  if (wallpaperState.type === 'default' || !wallpaperState.value) {
    desktop.classList.remove('has-custom-wallpaper');
    wallpaperCustom.classList.remove('has-image');
    wallpaperCustom.style.backgroundImage = '';
    wallpaperCustom.style.backgroundColor = '';
    wallpaperCustom.style.filter = 'none';
    wallpaperDim.style.opacity = '0';
    wallpaperDim.style.background = 'transparent';
    return;
  }
  desktop.classList.add('has-custom-wallpaper');
  wallpaperCustom.classList.add('has-image');
  if (wallpaperState.type === 'image') {
    wallpaperCustom.style.backgroundImage = `url("${wallpaperState.value.replaceAll('"', '%22')}")`;
    wallpaperCustom.style.backgroundColor = '';
  } else if (wallpaperState.type === 'gradient') {
    wallpaperCustom.style.backgroundImage = wallpaperState.value;
    wallpaperCustom.style.backgroundColor = '';
  } else if (wallpaperState.type === 'color') {
    wallpaperCustom.style.backgroundImage = 'none';
    wallpaperCustom.style.backgroundColor = wallpaperState.value;
  }
  wallpaperCustom.style.backgroundSize = wallpaperState.fit === 'stretch' ? '100% 100%' : wallpaperState.fit;
  wallpaperCustom.style.backgroundPosition = 'center';
  wallpaperCustom.style.filter = wallpaperState.blur ? `blur(${wallpaperState.blur}px)` : 'none';
  wallpaperCustom.style.transform = wallpaperState.blur ? 'scale(1.04)' : 'none';
  wallpaperDim.style.background = `rgba(0,0,0,${wallpaperState.dim})`;
  wallpaperDim.style.opacity = wallpaperState.dim > 0 ? '1' : '0';
}
applyWallpaper(wallpaperState);

function setWallpaperImage(src, opts = {}) {
  const next = { type: 'image', value: src, fit: opts.fit ?? wallpaperState.fit, blur: opts.blur ?? wallpaperState.blur, dim: opts.dim ?? wallpaperState.dim, presetId: opts.presetId ?? null };
  applyWallpaper(next);
  document.querySelectorAll('.wallpaper-preset').forEach(el => el.classList.toggle('active', el.dataset.presetId === next.presetId));
  syncWallpaperAppPreview();
}
function setWallpaperPreset(preset) {
  if (preset.type === 'default') { applyWallpaper({ type: 'default', value: '', fit: 'cover', blur: 0, dim: 0, presetId: 'default' }); }
  else { applyWallpaper({ type: preset.type, value: preset.value, fit: preset.type === 'gradient' ? 'cover' : 'cover', blur: wallpaperState.blur, dim: wallpaperState.dim, presetId: preset.id }); }
  syncWallpaperAppPreview();
}
function syncWallpaperAppPreview() {
  document.querySelectorAll('.wallpaper-preview-inner').forEach(el => {
    if (wallpaperState.type === 'default') { el.style.backgroundImage = 'linear-gradient(180deg, #a9d5dc 0%, #d8e8dc 62%, #98c09b 100%)'; el.style.backgroundColor = ''; el.style.backgroundSize = 'cover'; }
    else if (wallpaperState.type === 'image') { el.style.backgroundImage = `url("${wallpaperState.value}")`; el.style.backgroundColor = ''; el.style.backgroundSize = wallpaperState.fit === 'stretch' ? '100% 100%' : wallpaperState.fit; }
    else if (wallpaperState.type === 'gradient') { el.style.backgroundImage = wallpaperState.value; el.style.backgroundColor = ''; el.style.backgroundSize = 'cover'; }
    else if (wallpaperState.type === 'color') { el.style.backgroundImage = 'none'; el.style.backgroundColor = wallpaperState.value; }
    el.style.filter = wallpaperState.blur ? `blur(${Math.min(wallpaperState.blur, 6)}px)` : 'none';
  });
  document.querySelectorAll('.wallpaper-fit-select').forEach(el => el.value = wallpaperState.fit);
  document.querySelectorAll('.wallpaper-blur').forEach(el => el.value = wallpaperState.blur);
  document.querySelectorAll('.wallpaper-dim').forEach(el => el.value = Math.round(wallpaperState.dim * 100));
  document.querySelectorAll('.wallpaper-blur-value').forEach(el => el.textContent = `${wallpaperState.blur}px`);
  document.querySelectorAll('.wallpaper-dim-value').forEach(el => el.textContent = `${Math.round(wallpaperState.dim * 100)}%`);
}

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
  wallpaper: {
    title: 'Wallpaper Studio',
    content: `
      <div class="wallpaper-app">
        <div class="wallpaper-preview" id="wallpaperPreview">
          <div class="wallpaper-preview-inner"></div>
          <span class="wallpaper-preview-label">LIVE PREVIEW</span>
        </div>

        <div class="wallpaper-section">
          <h3>UPLOAD YOUR OWN</h3>
          <p>Drop an image anywhere on the desktop or pick a file. Stored locally — stays even after refresh.</p>
          <div class="wallpaper-upload">
            <label for="wallpaperFile">↗ Choose image
              <input id="wallpaperFile" type="file" accept="image/*" />
            </label>
            <span class="wallpaper-status" id="wallpaperFileStatus">No file chosen</span>
          </div>
          <div class="wallpaper-url-row">
            <input id="wallpaperUrl" type="url" placeholder="https://images.unsplash.com/..." aria-label="Wallpaper image URL" />
            <button id="wallpaperUrlBtn" type="button">Use URL</button>
          </div>
          <div class="wallpaper-url-row">
            <input id="wallpaperColor" type="color" value="#a9d5dc" aria-label="Pick solid color" title="Pick solid color" style="max-width:62px; height:36px; padding:2px;" />
            <button id="wallpaperColorBtn" type="button" style="flex:1">Use solid color</button>
          </div>
        </div>

        <div class="wallpaper-section">
          <h3>PRESETS — CLICK TO APPLY</h3>
          <div class="wallpaper-presets" id="wallpaperPresets"></div>
        </div>

        <div class="wallpaper-section">
          <h3>ADJUST</h3>
          <div class="wallpaper-controls">
            <div class="wallpaper-control">
              <label><span>Fit</span><span class="wallpaper-fit-value"></span></label>
              <select class="wallpaper-fit-select" aria-label="Wallpaper fit">
                <option value="cover">Cover — fill screen</option>
                <option value="contain">Contain — show full image</option>
                <option value="stretch">Stretch — distort to fit</option>
              </select>
            </div>
            <div class="wallpaper-control">
              <label><span>Blur</span><span class="wallpaper-blur-value">0px</span></label>
              <input class="wallpaper-blur" type="range" min="0" max="12" value="0" aria-label="Blur amount" />
            </div>
            <div class="wallpaper-control">
              <label><span>Dim — darken wallpaper for readability</span><span class="wallpaper-dim-value">0%</span></label>
              <input class="wallpaper-dim" type="range" min="0" max="60" value="0" aria-label="Dim amount" />
            </div>
          </div>
          <div class="wallpaper-actions">
            <button id="wallpaperReset" type="button" class="danger">↺ Reset to Orbit default</button>
            <button id="wallpaperShuffle" type="button">✦ Surprise me</button>
          </div>
          <p class="wallpaper-status" id="wallpaperStatus" aria-live="polite">Ready. Changes are saved automatically.</p>
        </div>
      </div>
    `
  },
  random: {
    title: 'Random Lab',
    content: '<div class="random-lab"><p>Four ways to shake up the workspace.</p><div class="random-actions"><button class="random-style">Random style</button><button class="random-number">Random 10,000</button><button class="random-data">Generate 10,000</button></div><form class="random-custom"><input aria-label="Custom random range" type="number" min="1" max="1000000" value="10000" /><button type="submit">Custom</button></form><p class="random-output" aria-live="polite">Ready for a little entropy.</p></div>'
  }
};

function openApp(appId) {
  launcherPanel.hidden = true;
  if (apps[appId]?.externalUrl) { window.open(apps[appId].externalUrl, '_blank', 'noopener,noreferrer'); return; }
  if (openWindows.has(appId)) {
    const existing = openWindows.get(appId);
    existing.style.zIndex = ++highestZ;
    return;
  }
  const app = apps[appId];
  if (!app) return;
  const windowElement = document.createElement('article');
  windowElement.className = 'window';
  if (appId === 'browser') windowElement.classList.add('browser-window');
  windowElement.setAttribute('role', 'dialog');
  windowElement.cleanup = [];
  windowElement.setAttribute('aria-label', app.title);
  windowElement.style.transform = `translate(calc(-50% + ${openWindows.size * 28}px), ${openWindows.size * 24}px)`;
  windowElement.style.zIndex = ++highestZ;
  windowElement.innerHTML = `<header class="window-header"><span class="window-title">${app.title}</span><span class="window-actions"><button class="minimize-window" aria-label="Minimize ${app.title}">−</button><button class="close-window" aria-label="Close ${app.title}">×</button></span></header><div class="window-content">${app.content}</div>`;
  const maximizeButton = document.createElement('button');
  maximizeButton.className = 'maximize-window';
  maximizeButton.setAttribute('aria-label', `Maximize ${app.title}`);
  maximizeButton.textContent = '□';
  windowElement.querySelector('.window-actions').prepend(maximizeButton);
  windowLayer.append(windowElement);
  openWindows.set(appId, windowElement);
  updateOpenCount();
  windowElement.addEventListener('pointerdown', () => { windowElement.style.zIndex = ++highestZ; });
  windowElement.querySelector('.close-window').addEventListener('click', () => { windowElement.cleanup.forEach((cleanup) => cleanup()); windowElement.remove(); openWindows.delete(appId); updateOpenCount(); });
  const trayButton = document.createElement('button');
  trayButton.className = 'tray-item';
  trayButton.textContent = app.title;
  trayButton.addEventListener('click', () => { windowElement.hidden = false; windowElement.style.zIndex = ++highestZ; });
  windowTray.append(trayButton);
  windowElement.querySelector('.minimize-window').addEventListener('click', () => { windowElement.hidden = true; });
  maximizeButton.addEventListener('click', () => {
    const maximized = windowElement.classList.toggle('is-maximized');
    maximizeButton.textContent = maximized ? '❐' : '□';
    maximizeButton.setAttribute('aria-label', `${maximized ? 'Restore' : 'Maximize'} ${app.title}`);
  });
  windowElement.querySelector('.close-window').addEventListener('click', () => trayButton.remove());
  makeDraggable(windowElement);
  windowElement.querySelector('.notes-editor')?.addEventListener('input', (event) => { state.notes = event.target.value; storage.set('orbit-notes', state.notes); });
  const notesEditor = windowElement.querySelector('.notes-editor');
  if (notesEditor) notesEditor.value = state.notes;
  const filesList = windowElement.querySelector('.files-list');
  if (filesList) {
    const renderFiles = () => {
      filesList.innerHTML = state.files.map((file, index) => `<div class="file-row"><button class="file-open" data-file-index="${index}">${file.name}</button><span class="file-type">${file.type}</span></div>`).join('');
      filesList.querySelectorAll('.file-open').forEach((button) => button.addEventListener('click', () => {
        const file = state.files[button.dataset.fileIndex];
        const updated = prompt(`Edit ${file.name}`, file.content);
        if (updated !== null) { file.content = updated; storage.set('orbit-files', JSON.stringify(state.files)); }
      }));
    };
    renderFiles();
    windowElement.querySelector('.new-file').addEventListener('click', () => {
      const name = prompt('New file name', 'untitled.txt');
      if (!name) return;
      state.files.push({ name, type: 'TEXT', content: '' });
      storage.set('orbit-files', JSON.stringify(state.files));
      renderFiles();
    });
  }
  const calculator = windowElement.querySelector('.calculator');
  if (calculator) {
    let expression = '';
    const display = calculator.querySelector('.calculator-display');
    calculator.addEventListener('click', (event) => {
      const key = event.target.closest('[data-key]')?.dataset.key;
      if (!key) return;
      if (key === 'clear') expression = '';
      else if (key === 'backspace') expression = expression.slice(0, -1);
      else if (key === 'equals') {
        try {
          const formula = expression.replaceAll('×', '*').replaceAll('÷', '/');
          if (!/^[0-9+\-*/.() ]+$/.test(formula)) throw new Error('Invalid expression');
          expression = String(Function(`"use strict"; return (${formula})`)());
        }
        catch { expression = 'Error'; }
      } else if (expression === 'Error') expression = key === 'decimal' ? '0.' : key;
      else if (key === 'operator') expression += event.target.textContent;
      else expression += key === 'decimal' && expression.endsWith('.') ? '' : key === 'decimal' ? '.' : key;
      display.value = expression || '0';
      display.textContent = expression || '0';
    });
  }
  const paintCanvas = windowElement.querySelector('.paint-canvas');
  if (paintCanvas) {
    const context = paintCanvas.getContext('2d');
    let painting = false;
    const color = windowElement.querySelector('.paint-color');
    const size = windowElement.querySelector('.paint-size');
    const draw = (event) => { if (!painting) return; const rect = paintCanvas.getBoundingClientRect(); context.lineTo((event.clientX - rect.left) * paintCanvas.width / rect.width, (event.clientY - rect.top) * paintCanvas.height / rect.height); context.stroke(); };
    paintCanvas.addEventListener('pointerdown', (event) => { painting = true; paintCanvas.setPointerCapture(event.pointerId); const rect = paintCanvas.getBoundingClientRect(); context.beginPath(); context.moveTo((event.clientX - rect.left) * paintCanvas.width / rect.width, (event.clientY - rect.top) * paintCanvas.height / rect.height); });
    paintCanvas.addEventListener('pointermove', draw);
    paintCanvas.addEventListener('pointerup', () => { painting = false; });
    paintCanvas.addEventListener('pointerleave', () => { painting = false; });
    const configureBrush = () => { context.strokeStyle = color.value; context.lineWidth = size.value; context.lineCap = 'round'; context.lineJoin = 'round'; };
    color.addEventListener('input', configureBrush); size.addEventListener('input', configureBrush); configureBrush();
    windowElement.querySelector('.paint-clear').addEventListener('click', () => context.clearRect(0, 0, paintCanvas.width, paintCanvas.height));
    windowElement.querySelector('.paint-save').addEventListener('click', () => { const link = document.createElement('a'); link.download = 'orbit-drawing.png'; link.href = paintCanvas.toDataURL(); link.click(); });
  }
  const clockApp = windowElement.querySelector('.clock-app');
  if (clockApp) {
    const updateClockApp = () => { const now = new Date(); clockApp.querySelector('.clock-time').textContent = now.toLocaleTimeString([], { hour12: false }); clockApp.querySelector('.clock-date').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); clockApp.querySelector('.clock-zone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone; };
    updateClockApp(); windowElement.clockTimer = setInterval(updateClockApp, 1000); windowElement.cleanup.push(() => clearInterval(windowElement.clockTimer));
  }
  const gameApp = windowElement.querySelector('.game-app');
  if (gameApp) {
    let score = 0; let playing = false; let timer;
    const target = gameApp.querySelector('.game-target'); const scoreLabel = gameApp.querySelector('.game-score strong');
    const moveTarget = () => { target.style.left = `${8 + Math.random() * 76}%`; target.style.top = `${8 + Math.random() * 70}%`; };
    gameApp.querySelector('.game-start').addEventListener('click', (event) => { score = 0; playing = true; scoreLabel.textContent = score; event.target.textContent = 'Restart game'; moveTarget(); clearTimeout(timer); timer = setTimeout(() => { playing = false; event.target.textContent = 'Play again'; }, 30000); });
    windowElement.cleanup.push(() => clearTimeout(timer));
    target.addEventListener('click', () => { if (!playing) return; score += 1; scoreLabel.textContent = score; moveTarget(); });
  }
  const calendarApp = windowElement.querySelector('.calendar-app');
  if (calendarApp) {
    let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const renderCalendar = () => { const grid = calendarApp.querySelector('.calendar-grid'); const monthLabel = calendarApp.querySelector('.calendar-month'); const firstDay = month.getDay(); const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); const today = new Date(); monthLabel.textContent = month.toLocaleDateString([], { month: 'long', year: 'numeric' }); grid.innerHTML = ['S','M','T','W','T','F','S'].map((day) => `<span class="calendar-weekday">${day}</span>`).join('') + '<span></span>'.repeat(firstDay) + Array.from({ length: days }, (_, index) => `<button class="calendar-day ${index + 1 === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear() ? 'today' : ''}">${index + 1}</button>`).join(''); };
    calendarApp.querySelector('.calendar-prev').addEventListener('click', () => { month.setMonth(month.getMonth() - 1); renderCalendar(); }); calendarApp.querySelector('.calendar-next').addEventListener('click', () => { month.setMonth(month.getMonth() + 1); renderCalendar(); }); renderCalendar();
  }
  const snakeCanvas = windowElement.querySelector('.snake-canvas');
  if (snakeCanvas) {
    const context = snakeCanvas.getContext('2d'); const size = 16; let snake; let food; let direction; let nextDirection; let score = 0; let timer; let playing = false;
    const scoreLabel = windowElement.querySelector('.game-score strong');
    const placeFood = () => { food = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) }; if (snake.some((part) => part.x === food.x && part.y === food.y)) placeFood(); };
    const draw = () => { context.fillStyle = '#172421'; context.fillRect(0, 0, 320, 320); context.fillStyle = '#d4f36a'; snake.forEach((part) => context.fillRect(part.x * 20 + 2, part.y * 20 + 2, 16, 16)); context.fillStyle = '#ff816b'; context.fillRect(food.x * 20 + 2, food.y * 20 + 2, 16, 16); };
    const end = () => { playing = false; clearInterval(timer); windowElement.querySelector('.game-start').textContent = 'Play again'; };
    const tick = () => { direction = nextDirection; const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y }; if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size || snake.some((part) => part.x === head.x && part.y === head.y)) return end(); snake.unshift(head); if (head.x === food.x && head.y === food.y) { score += 1; scoreLabel.textContent = score; placeFood(); } else snake.pop(); draw(); };
    const start = () => { snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]; food = { x: 12, y: 8 }; direction = { x: 1, y: 0 }; nextDirection = direction; score = 0; scoreLabel.textContent = 0; playing = true; windowElement.querySelector('.game-start').textContent = 'Restart'; clearInterval(timer); timer = setInterval(tick, 130); draw(); };
    windowElement.querySelector('.game-start').addEventListener('click', start); windowElement.addEventListener('keydown', (event) => { const keys = { ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 } }; const change = keys[event.key]; if (change && playing && !(change.x === -direction.x && change.y === -direction.y)) { event.preventDefault(); nextDirection = change; } }); windowElement.cleanup.push(() => clearInterval(timer)); start();
  }
  const minesApp = windowElement.querySelector('.mines-app');
  if (minesApp) {
    const grid = minesApp.querySelector('.mines-grid'); const status = minesApp.querySelector('.mines-status'); let mines; let revealed; let flags;
    const neighbors = (index) => { const x = index % 8; const y = Math.floor(index / 8); return Array.from({ length: 9 }, (_, offset) => { const dx = (offset % 3) - 1; const dy = Math.floor(offset / 3) - 1; const nx = x + dx; const ny = y + dy; return nx >= 0 && nx < 8 && ny >= 0 && ny < 8 ? ny * 8 + nx : -1; }).filter((value) => value >= 0 && value !== index); };
    const render = () => { grid.innerHTML = ''; for (let index = 0; index < 64; index += 1) { const cell = document.createElement('button'); cell.className = 'mine-cell'; cell.setAttribute('role', 'gridcell'); cell.textContent = flags.has(index) ? '⚑' : revealed.has(index) ? (mines.has(index) ? '✹' : '') : ''; if (revealed.has(index)) cell.classList.add('revealed'); if (mines.has(index) && revealed.has(index)) cell.classList.add('mine-hit'); cell.addEventListener('click', () => reveal(index)); cell.addEventListener('contextmenu', (event) => { event.preventDefault(); if (!revealed.has(index)) { flags.has(index) ? flags.delete(index) : flags.add(index); render(); } }); grid.append(cell); } };
    const reveal = (index) => { if (flags.has(index) || revealed.has(index)) return; revealed.add(index); if (mines.has(index)) { status.textContent = 'Boom'; mines.forEach((mine) => revealed.add(mine)); render(); return; } if (!neighbors(index).some((neighbor) => mines.has(neighbor))) neighbors(index).forEach((neighbor) => { if (!revealed.has(neighbor)) reveal(neighbor); }); if (revealed.size >= 54) status.textContent = 'Cleared'; render(); };
    const reset = () => { mines = new Set(); revealed = new Set(); flags = new Set(); while (mines.size < 10) mines.add(Math.floor(Math.random() * 64)); status.textContent = 'Ready'; render(); }; minesApp.querySelector('.mines-reset').addEventListener('click', reset); reset();
  }
  const cameraApp = windowElement.querySelector('.camera-app');
  if (cameraApp) {
    const video = cameraApp.querySelector('.camera-preview'); const status = cameraApp.querySelector('.camera-status'); const startButton = cameraApp.querySelector('.camera-start'); const snapButton = cameraApp.querySelector('.camera-snap'); const snapshot = cameraApp.querySelector('.camera-snapshot'); let stream;
    startButton.addEventListener('click', async () => { if (!navigator.mediaDevices?.getUserMedia) { status.textContent = 'Camera is not supported in this browser.'; return; } try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); video.srcObject = stream; snapButton.disabled = false; startButton.textContent = 'Camera enabled'; status.textContent = 'Ready to capture.'; } catch { status.textContent = 'Camera permission was denied.'; } });
    snapButton.addEventListener('click', () => { snapshot.width = video.videoWidth || 640; snapshot.height = video.videoHeight || 480; snapshot.getContext('2d').drawImage(video, 0, 0, snapshot.width, snapshot.height); snapshot.hidden = false; status.textContent = 'Snapshot captured locally.'; });
    windowElement.cleanup.push(() => stream?.getTracks().forEach((track) => track.stop()));
  }
  const terminalInput = windowElement.querySelector('.terminal-input');
  terminalInput?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = terminalInput.querySelector('input');
    const output = windowElement.querySelector('.terminal-output');
    const raw = input.value.trim();
    const command = raw.toLowerCase();
    if (command === 'clear') output.innerHTML = '';
    else if (command === 'help') output.insertAdjacentHTML('beforeend', '<p>help &nbsp; clear &nbsp; date &nbsp; about &nbsp; wallpaper &lt;url&gt; &nbsp; wallpaper reset &nbsp; dora &nbsp; dora fly &nbsp; dora hide &nbsp; dora show &nbsp; dorayaki</p>');
    else if (command === 'date') output.insertAdjacentHTML('beforeend', `<p>${new Date().toString()}</p>`);
    else if (command === 'about') output.insertAdjacentHTML('beforeend', '<p>Orbit is a local-first web workspace.</p>');
    else if (command.startsWith('wallpaper')) {
      const arg = raw.slice(9).trim();
      if (!arg || arg === 'reset' || arg === 'default') { applyWallpaper({ type: 'default', value: '', fit: 'cover', blur: 0, dim: 0, presetId: 'default' }); syncWallpaperAppPreview(); output.insertAdjacentHTML('beforeend', '<p>Wallpaper reset to Orbit default.</p>'); }
      else {
        const url = arg.replace(/^"|"$/g, '').trim();
        const img = new Image();
        img.onload = () => { applyWallpaper({ type: 'image', value: url, fit: wallpaperState.fit, blur: wallpaperState.blur, dim: wallpaperState.dim, presetId: null }); syncWallpaperAppPreview(); output.insertAdjacentHTML('beforeend', `<p>Wallpaper set to ${url}</p>`); output.scrollTop = output.scrollHeight; };
        img.onerror = () => output.insertAdjacentHTML('beforeend', `<p>Could not load wallpaper: ${url}</p>`);
        img.src = url;
        output.insertAdjacentHTML('beforeend', `<p>Loading wallpaper...</p>`);
      }
    }
    else if (command === 'dora' || command === 'doraemon') { if(window.doraSay) window.doraSay("Doraemon here! Try 'dora fly' or 'dora hide' 💙🚁", 3000); output.insertAdjacentHTML('beforeend', '<p>Doraemon waved hello! Click him or type dora fly / dora hide</p>'); }
    else if (command === 'dora fly' || command === 'fly') { if(window.doraFly) window.doraFly(); output.insertAdjacentHTML('beforeend', '<p>Bambocopter ON! 🚁 Doraemon took off!</p>'); }
    else if (command === 'dora hide' || command === 'dora remove') { if(window.doraHide) window.doraHide(); output.insertAdjacentHTML('beforeend', '<p>Doraemon hid — summon with dora show or button 💤</p>'); }
    else if (command === 'dora show' || command === 'dora summon') { if(window.doraShow) window.doraShow(); output.insertAdjacentHTML('beforeend', '<p>Doraemon is back! 💙</p>'); }
    else if (command === 'dora nap') { output.insertAdjacentHTML('beforeend', '<p>Doraemon napping 20s… 😴</p>'); if(window.doraSay) window.doraSay("Shhh… nap time 😴", 2200); const d=document.querySelector('#doraemon'); if(d){ d.style.opacity='.28'; d.style.pointerEvents='none'; } setTimeout(()=>{ const dd=document.querySelector('#doraemon'); if(dd){ dd.style.opacity=''; dd.style.pointerEvents=''; } if(window.doraSay) window.doraSay("I’m back! 💙", 2600); }, 20000); }
    else if (command === 'dorayaki') { output.insertAdjacentHTML('beforeend', '<p>🥞 *doraemon munches dorayaki* delicious! Try clicking him!</p>'); if(window.doraSay) window.doraSay("Yum yum dorayaki! 🥞 Thanks!", 2600); }
    else if (command) output.insertAdjacentHTML('beforeend', `<p>Command not found: ${command}</p>`);
    output.scrollTop = output.scrollHeight;
    input.value = '';
  });
  const browserFrame = windowElement.querySelector('.browser-frame');
  const addressForm = windowElement.querySelector('.address-form');
  if (browserFrame && addressForm) {
    const addressInput = windowElement.querySelector('.address-input');
    const navigate = () => {
      let address = addressInput.value.trim();
      if (!address) return;
      if (!/^https?:\/\//i.test(address)) address = `https://${address}`;
      addressInput.value = address;
      browserFrame.src = address;
    };
    windowElement.querySelector('.address-submit').addEventListener('click', navigate);
    addressInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); navigate(); } });
    windowElement.querySelector('.browser-back').addEventListener('click', () => browserFrame.contentWindow.history.back());
    windowElement.querySelector('.browser-forward').addEventListener('click', () => browserFrame.contentWindow.history.forward());
    windowElement.querySelector('.browser-reload').addEventListener('click', () => { browserFrame.contentWindow.location.reload(); });
    windowElement.querySelector('.external-link').addEventListener('click', () => window.open(addressInput.value, '_blank', 'noopener'));
    browserFrame.addEventListener('load', () => { windowElement.querySelector('.browser-message').hidden = true; });
  }
  const randomLab = windowElement.querySelector('.random-lab');
  if (randomLab) {
    const output = randomLab.querySelector('.random-output');
    const randomNumber = (maximum) => Math.floor(Math.random() * maximum) + 1;
    const randomColor = () => `hsl(${randomNumber(360)} 70% 70%)`;
    randomLab.querySelector('.random-style').addEventListener('click', () => {
      document.documentElement.style.setProperty('--lime', randomColor());
      document.documentElement.style.setProperty('--coral', randomColor());
      document.documentElement.style.setProperty('--blue', randomColor());
      output.textContent = 'Three interface colors randomized.';
    });
    randomLab.querySelector('.random-number').addEventListener('click', () => {
      output.textContent = `Random value: ${randomNumber(10000).toLocaleString()}`;
    });
    randomLab.querySelector('.random-data').addEventListener('click', () => {
      const started = performance.now();
      const records = Array.from({ length: 10000 }, (_, index) => ({ id: index + 1, value: randomNumber(10000), tag: randomNumber(4) }));
      const total = records.reduce((sum, record) => sum + record.value, 0);
      output.textContent = `Generated ${records.length.toLocaleString()} records, total ${total.toLocaleString()} in ${(performance.now() - started).toFixed(1)} ms.`;
    });
    randomLab.querySelector('.random-custom').addEventListener('submit', (event) => {
      event.preventDefault();
      const maximum = Math.max(1, Math.min(1000000, Number(event.currentTarget.querySelector('input').value) || 10000));
      output.textContent = `Random value from 1-${maximum.toLocaleString()}: ${randomNumber(maximum).toLocaleString()}`;
    });
  }
  const wallpaperApp = windowElement.querySelector('.wallpaper-app');
  if (wallpaperApp) {
    const presetsEl = wallpaperApp.querySelector('#wallpaperPresets');
    const statusEl = wallpaperApp.querySelector('#wallpaperStatus');
    const fileInput = wallpaperApp.querySelector('#wallpaperFile');
    const fileStatus = wallpaperApp.querySelector('#wallpaperFileStatus');
    const urlInput = wallpaperApp.querySelector('#wallpaperUrl');
    const urlBtn = wallpaperApp.querySelector('#wallpaperUrlBtn');
    const colorInput = wallpaperApp.querySelector('#wallpaperColor');
    const colorBtn = wallpaperApp.querySelector('#wallpaperColorBtn');
    const fitSelect = wallpaperApp.querySelector('.wallpaper-fit-select');
    const blurInput = wallpaperApp.querySelector('.wallpaper-blur');
    const dimInput = wallpaperApp.querySelector('.wallpaper-dim');

    const renderPresets = () => {
      presetsEl.innerHTML = '';
      wallpaperPresets.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wallpaper-preset';
        btn.dataset.presetId = preset.id;
        if (preset.id === wallpaperState.presetId || (wallpaperState.type === 'default' && preset.id === 'default')) btn.classList.add('active');
        if (preset.type === 'image') {
          btn.style.backgroundImage = preset.preview;
          btn.style.backgroundSize = 'cover';
          btn.style.backgroundPosition = 'center';
        } else {
          btn.style.background = preset.preview;
        }
        const label = document.createElement('span');
        label.textContent = preset.name;
        btn.append(label);
        btn.addEventListener('click', () => {
          wallpaperApp.querySelectorAll('.wallpaper-preset').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
          setWallpaperPreset(preset);
          statusEl.textContent = preset.id === 'default' ? 'Restored Orbit default — clean & calm.' : `Applied preset: ${preset.name}.`;
        });
        presetsEl.append(btn);
      });
    };
    renderPresets();
    syncWallpaperAppPreview();

    const updateFit = (value) => {
      applyWallpaper({ ...wallpaperState, fit: value });
      syncWallpaperAppPreview();
      statusEl.textContent = `Fit: ${value}.`;
    };
    const updateBlur = (value) => {
      const blur = Number(value);
      applyWallpaper({ ...wallpaperState, blur });
      syncWallpaperAppPreview();
      statusEl.textContent = blur ? `Blur: ${blur}px — softens the background.` : 'Blur removed.';
    };
    const updateDim = (value) => {
      const dim = Number(value) / 100;
      applyWallpaper({ ...wallpaperState, dim });
      syncWallpaperAppPreview();
      statusEl.textContent = dim ? `Dim: ${value}% — better contrast for text.` : 'Dim removed.';
    };

    fitSelect.addEventListener('change', (e) => updateFit(e.target.value));
    blurInput.addEventListener('input', (e) => { document.querySelectorAll('.wallpaper-blur-value').forEach(el => el.textContent = `${e.target.value}px`); });
    blurInput.addEventListener('change', (e) => updateBlur(e.target.value));
    dimInput.addEventListener('input', (e) => { document.querySelectorAll('.wallpaper-dim-value').forEach(el => el.textContent = `${e.target.value}%`); });
    dimInput.addEventListener('change', (e) => updateDim(e.target.value));

    const handleFile = (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) { statusEl.textContent = 'Please pick an image file (PNG, JPG, WebP).'; return; }
      if (file.size > 4.5 * 1024 * 1024) { statusEl.textContent = 'Image is large (>4.5MB). Try compressing or use a URL instead; it may hit storage limits.'; }
      fileStatus.textContent = `${file.name} — ${(file.size/1024).toFixed(0)} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          // quick size guard for localStorage (approx 5MB limit)
          if (String(dataUrl).length > 4.8 * 1024 * 1024) {
            statusEl.textContent = 'Image too large to save locally. Try a smaller image or paste an image URL.';
            return;
          }
          applyWallpaper({ type: 'image', value: dataUrl, fit: wallpaperState.fit, blur: wallpaperState.blur, dim: wallpaperState.dim, presetId: null });
          syncWallpaperAppPreview();
          wallpaperApp.querySelectorAll('.wallpaper-preset').forEach(el => el.classList.remove('active'));
          statusEl.textContent = `Wallpaper set from file: ${file.name}. Saved locally.`;
          fileStatus.textContent = 'Saved — will persist after reload.';
        } catch (err) { statusEl.textContent = 'Could not save that image locally.'; }
      };
      reader.onerror = () => { statusEl.textContent = 'Failed to read that file.'; };
      reader.readAsDataURL(file);
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    urlBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) { statusEl.textContent = 'Paste an image URL first.'; return; }
      // basic validation + allow relative data URLs
      if (!/^https?:\/\//i.test(url) && !url.startsWith('data:image/')) { statusEl.textContent = 'URL should start with https://'; return; }
      // test load
      const img = new Image();
      img.onload = () => {
        applyWallpaper({ type: 'image', value: url, fit: wallpaperState.fit, blur: wallpaperState.blur, dim: wallpaperState.dim, presetId: null });
        syncWallpaperAppPreview();
        wallpaperApp.querySelectorAll('.wallpaper-preset').forEach(el => el.classList.remove('active'));
        statusEl.textContent = 'Wallpaper updated from URL — saved.';
      };
      img.onerror = () => { statusEl.textContent = 'Could not load that URL. Check link or try another image.'; };
      // add timeout for cross-origin
      img.src = url;
      statusEl.textContent = 'Loading image...';
    });
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); urlBtn.click(); } });

    colorBtn.addEventListener('click', () => {
      const color = colorInput.value;
      applyWallpaper({ type: 'color', value: color, fit: 'cover', blur: wallpaperState.blur, dim: wallpaperState.dim, presetId: null });
      syncWallpaperAppPreview();
      wallpaperApp.querySelectorAll('.wallpaper-preset').forEach(el => el.classList.remove('active'));
      statusEl.textContent = `Solid color applied: ${color}.`;
    });

    wallpaperApp.querySelector('#wallpaperReset').addEventListener('click', () => {
      applyWallpaper({ type: 'default', value: '', fit: 'cover', blur: 0, dim: 0, presetId: 'default' });
      renderPresets();
      syncWallpaperAppPreview();
      fileStatus.textContent = 'No file chosen';
      urlInput.value = '';
      statusEl.textContent = 'Reset to Orbit default. Ah, fresh air.';
    });
    wallpaperApp.querySelector('#wallpaperShuffle').addEventListener('click', () => {
      const pool = wallpaperPresets.filter(p => p.id !== 'default');
      const pick = pool[Math.floor(Math.random()*pool.length)];
      wallpaperApp.querySelectorAll('.wallpaper-preset').forEach(el => el.classList.toggle('active', el.dataset.presetId===pick.id));
      setWallpaperPreset(pick);
      statusEl.textContent = `Surprise: ${pick.name} — shuffled.`;
    });

    // drag & drop onto preview
    const preview = wallpaperApp.querySelector('#wallpaperPreview');
    ;['dragenter','dragover'].forEach(evt => preview.addEventListener(evt, (e)=>{ e.preventDefault(); preview.style.outline='2px dashed var(--ink)'; preview.style.outlineOffset='3px'; }));
    ;['dragleave','drop'].forEach(evt => preview.addEventListener(evt, (e)=>{ preview.style.outline=''; }));
    preview.addEventListener('drop', (e)=>{ e.preventDefault(); const file = e.dataTransfer?.files?.[0]; if (file) handleFile(file); });
  }
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
  document.querySelectorAll('.app-icon').forEach((button) => { button.hidden = Boolean(query) && !button.textContent.toLowerCase().includes(query); });
  // hide empty groups for cleaner hand-grouped layout
  document.querySelectorAll('.app-group').forEach(group => {
    const visible = [...group.querySelectorAll('.app-icon')].some(b => !b.hidden);
    group.hidden = Boolean(query) && !visible;
    group.style.opacity = visible || !query ? '1' : '0.3';
  });
  const eyebrow = document.querySelector('.constellation-eyebrow');
  if (eyebrow) eyebrow.hidden = Boolean(query);
  if (query) launcherPanel.hidden = true;
  const matches = Object.entries(apps).filter(([, app]) => app.title.toLowerCase().includes(query));
  dockSearchResults.replaceChildren(...matches.map(([appId, app]) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.app = appId; button.setAttribute('role', 'option'); button.textContent = app.title; button.addEventListener('click', () => { openApp(appId); dockSearch.value = ''; dockSearch.dispatchEvent(new Event('input')); }); return button; }));
  dockSearchResults.hidden = !query || matches.length === 0;
});
function launchDockSearchMatch() { const firstMatch = [...document.querySelectorAll('.app-icon')].find((button) => !button.hidden); if (firstMatch) openApp(firstMatch.dataset.app); }
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
document.querySelector('#wallpaperQuickButton')?.addEventListener('click', () => openApp('wallpaper'));
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
        anime({ targets: '.app-icon', translateY: [-6,0], delay: anime.stagger(30), duration: 500, easing:'easeOutBack' });
      }
      const doodle=document.querySelector('.doodle');
      if(doodle){ doodle.style.opacity='.55'; doodle.textContent='✦ you found the wiggle! try dragging the sticky note ✦'; setTimeout(()=>{ doodle.style.opacity='.18'; doodle.textContent='✦ orbit is personal — keep it messy ✦'; }, 2600); }
    }
  });
})();

// Desktop drag & drop wallpaper — drop any image onto the desktop
(function setupDesktopWallpaperDrop() {
  let dragCounter = 0;
  const showDropHint = () => desktop.classList.add('wallpaper-drop-active');
  const hideDropHint = () => desktop.classList.remove('wallpaper-drop-active');
  desktop.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    dragCounter += 1;
    e.preventDefault();
    showDropHint();
  });
  desktop.addEventListener('dragover', (e) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });
  desktop.addEventListener('dragleave', (e) => {
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) hideDropHint();
  });
  desktop.addEventListener('drop', (e) => {
    dragCounter = 0;
    hideDropHint();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.preventDefault();
    // prevent click bubbling into openApp
    e.stopPropagation();
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result;
        if (String(dataUrl).length > 4.8 * 1024 * 1024) {
          // fallback: notify via wallpaper app if open, else alert
          const openWallpaper = openWindows.get('wallpaper');
          const status = openWallpaper?.querySelector('#wallpaperStatus');
          if (status) status.textContent = 'Dropped image too large (>5MB). Try a smaller file.';
          else alert('Image too large to save. Try a smaller image or use URL.');
          return;
        }
        applyWallpaper({ type: 'image', value: dataUrl, fit: wallpaperState.fit, blur: wallpaperState.blur, dim: wallpaperState.dim, presetId: null });
        syncWallpaperAppPreview();
        // auto-open wallpaper studio to show result
        openApp('wallpaper');
        const st = document.querySelector('#wallpaperStatus');
        if (st) st.textContent = `Dropped wallpaper applied: ${file.name}`;
      } catch {}
    };
    reader.readAsDataURL(file);
  });
})();

// Right-click desktop to quickly open wallpaper studio
desktop.addEventListener('contextmenu', (e) => {
  // only when clicking directly on desktop background, not on windows/dock
  if (e.target.closest('.window, .dock, .topbar, .launcher-panel, button')) return;
  e.preventDefault();
  openApp('wallpaper');
});
document.addEventListener('keydown', (event) => {
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
  terminal: { tag: 'MAKE', title: 'Terminal', desc: 'Orbit Terminal 1.0 — try help, wallpaper, date.' },
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
  wallpaper: { tag: 'SYSTEM', title: 'Wallpaper Studio', desc: 'Your vibe, your image — upload, URL, or preset.' },
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
document.querySelectorAll('.app-icon, .dock-item[data-app]').forEach(el => {
  el.addEventListener('mouseenter', () => { clearTimeout(tooltipTimer); showTooltip(el); });
  el.addEventListener('mouseleave', hideTooltip);
  el.addEventListener('focus', () => showTooltip(el));
  el.addEventListener('blur', hideTooltip);
  // hide on click
  el.addEventListener('click', hideTooltip);
});
desktop.addEventListener('scroll', hideTooltip, true);
window.addEventListener('scroll', hideTooltip, true);

// — sticky note drag (human, imperfect) —
(function makeStickyDraggable(){
  const sticky = document.querySelector('#deskSticky');
  if (!sticky) return;
  let sx, sy, ox, oy, dragging=false;
  sticky.addEventListener('pointerdown', (e)=>{
    if (e.target.closest('button')) return;
    dragging=true; sticky.setPointerCapture(e.pointerId);
    const r = sticky.getBoundingClientRect();
    sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
    sticky.style.transition='none';
  });
  sticky.addEventListener('pointermove', (e)=>{
    if(!dragging) return;
    const nx = Math.max(12, Math.min(ox + e.clientX - sx, window.innerWidth - sticky.offsetWidth - 12));
    const ny = Math.max(68, Math.min(oy + e.clientY - sy, window.innerHeight - 120));
    sticky.style.position='fixed'; sticky.style.left=nx+'px'; sticky.style.top=ny+'px'; sticky.style.marginTop='0';
  });
  const stop= (e)=>{ dragging=false; sticky.style.transition=''; try{ sticky.releasePointerCapture(e.pointerId);}catch{} };
  sticky.addEventListener('pointerup', stop);
  sticky.addEventListener('pointercancel', stop);
  // tap to wiggle
  sticky.addEventListener('click', ()=>{
    if (window.anime) anime({ targets: sticky, rotate: [1.1, -1.2, 1.1], duration: 420, easing:'easeInOutSine' });
  });
})();

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();
updateClock();
updateOpenCount();
updateStatusDate();
setInterval(updateClock, 30000);

// ── Doraemon — patrolling, flying, teasing ──
(function initDoraemon(){
  const dora = document.querySelector('#doraemon');
  const bubble = document.querySelector('#doraBubble');
  const bubbleText = bubble?.querySelector('.dora-bubble-text');
  const bubbleClose = bubble?.querySelector('.dora-bubble-close');
  if (!dora || !bubble) return;
  let x = Math.max(12, window.innerWidth * 0.22);
  let dir = 1;
  let speed = 0.9;
  let isFlying = false;
  let isPaused = false;
  let rafId = null;
  let flyTimer = null;
  let mischiefTimer = null;
  let blinkTimer = null;
  let idleTimer = null;
  const doraW = 74;
  const phrases = [
    "Hi Saksh! Need any gadget? 🔧",
    "Dorayaki time! One bite? 😋",
    "Shizuka says hi! 👋",
    "Don't forget to save Notes — I did! ✦",
    "Want to fly? Grab my hand! 🚁",
    "Boo! Did I scare you? Hehe 💙",
    "Your wallpaper is looking 🔥 today!",
    "Oops, I bumped the clock! ⏰ haha",
    "Nobita would love this OS! 📚",
    "Zzz... oh hi! You called? 😴",
    "Anywhere Door? I left it open! 🚪",
    "Let's play! Open a game? 🎮",
    "I'm guarding your Files! ▰",
    "Whoa — nice paint you made! ✎"
  ];
  const flyPhrases = ["Weeee! Bambocopter ON! 🚁💨","Look I'm flying~ Bzzzz!","Wheee! Catch me! ✨","Flying high over Orbit! ☁️"];
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
    if(isFlying) return;
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
    if(isFlying || isPaused) { rafId=requestAnimationFrame(patrol); return; }
    if(Math.random() < 0.006){ isPaused=true; dora.classList.remove('is-walking'); setTimeout(()=>{ isPaused=false; dora.classList.add('is-walking'); }, 900 + Math.random()*900); }
    if(Math.random() < 0.004 && !isFlying){ dir *= -1; }
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
  function scheduleFly(){
    clearTimeout(flyTimer);
    flyTimer=setTimeout(()=>{ if(!isFlying) fly(); scheduleFly(); }, 16000 + Math.random()*14000);
  }
  function scheduleMischief(){
    clearTimeout(mischiefTimer);
    mischiefTimer=setTimeout(()=>{ if(!isFlying) { const act=mischiefActs[Math.floor(Math.random()*mischiefActs.length)]; try{act();}catch{} } scheduleMischief(); }, 11000 + Math.random()*9000);
  }
  function scheduleBlink(){
    clearTimeout(blinkTimer);
    blinkTimer=setTimeout(()=>{ dora.classList.add('is-blinking'); setTimeout(()=> dora.classList.remove('is-blinking'), 140); scheduleBlink(); }, 2600 + Math.random()*3200);
  }
  function fly(){
    if(isFlying) return;
    isFlying=true;
    dora.classList.add('is-flying');
    dora.classList.remove('is-walking');
    showBubble(flyPhrases[Math.floor(Math.random()*flyPhrases.length)], 3400);
    const startX = x;
    const targetX = dir===1 ? maxX()-40 : 20;
    const flyDir = targetX > startX ? 1 : -1;
    dir = flyDir;
    if(dir===1) dora.classList.remove('is-facing-left'); else dora.classList.add('is-facing-left');
    dora.style.setProperty('--sx', dir);
    // takeoff + flight + land using anime if available
    if(window.anime){
      // store start bottom computed
      anime({
        targets: dora,
        left: [startX, targetX],
        bottom: [14, 180, 190, 14],
        duration: 4200,
        easing: 'easeInOutSine',
        update: ()=> { x = parseFloat(dora.style.left)||x; if(!bubble.hidden) placeBubble(); },
        complete: ()=>{
          isFlying=false; dora.classList.remove('is-flying'); dora.classList.add('is-walking');
          x = targetX; dora.style.left = x + 'px';
          doJump(); showBubble(phrases[Math.floor(Math.random()*phrases.length)], 3000);
        }
      });
      // propeller already spinning via CSS, add woosh trail
      anime({ targets: '.dora-shadow', scale:[1,.55,1], duration:4200, easing:'easeInOutSine' });
    } else {
      dora.style.transition='left 2.2s ease-in-out, bottom 2.2s ease-in-out';
      dora.style.left = targetX + 'px';
      dora.style.bottom = '180px';
      setTimeout(()=>{ dora.style.bottom='14px'; dora.style.left = targetX + 'px'; }, 2200);
      setTimeout(()=>{ dora.style.transition=''; isFlying=false; dora.classList.remove('is-flying'); dora.classList.add('is-walking'); x=targetX; }, 4400);
    }
  }
  // interactions
  dora.addEventListener('click', (e)=>{
    e.stopPropagation();
    doJump();
    const p = phrases[Math.floor(Math.random()*phrases.length)];
    showBubble(p, 3400);
    dropDorayaki();
    // 30% chance to fly on click
    if(Math.random() < 0.30 && !isFlying) setTimeout(fly, 320);
    if(window.anime) anime({ targets: dora, scale:[1,1.08,1], duration:320, easing:'easeOutBack' });
  });
  dora.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); dora.click(); }
    if(e.key==='f' || e.key==='F'){ fly(); }
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
      if(Math.abs(cx - (x + doraW/2)) < 220 && !isFlying){
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
      toggleBtn.innerHTML = visible ? '<span>🤖</span> Doraemon' : '<span>🤖</span> Doraemon ✕';
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
      if(!opts.silent) showBubble("I’m back! Let’s play! 💙🚁", 3000);
      syncToggles(true);
      if(persist) storage.set('orbit-dora-hidden','0');
      scheduleFly(); scheduleMischief();
    } else {
      if(!opts.silent) showBubble("Bye! Use toolbar to summon me! 👋<br><span style='font-size:9px;opacity:.7'>Dock → ● button</span>", 2600);
      setTimeout(()=>{
        dora.classList.add('is-hidden');
        dora.hidden=true;
        bubble.hidden=true;
        if(summonBtn) summonBtn.hidden=false;
        isPaused=true;
        clearTimeout(flyTimer); clearTimeout(mischiefTimer);
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
  scheduleFly();
  scheduleMischief();
  scheduleBlink();
  // welcome only if visible
  if(!wasHidden) setTimeout(()=> showBubble("Hey Saksh! I’m patrolling the base — click me! 💙🚁<br><span style='opacity:.7;font-size:9px'>Hide me via dock ● — Right-click for nap</span>", 4200), 1200);
  window.addEventListener('resize', ()=>{ x=Math.min(x, maxX()); dora.style.left=x+'px'; });
  // expose for terminal: window.doraFly = fly
  window.doraFly = fly;
  window.doraSay = showBubble;
  window.doraHide = ()=> setDoraVisible(false);
  window.doraShow = ()=> setDoraVisible(true);
  window.doraToggle = ()=> {
    const vis = !dora.classList.contains('is-hidden') && !dora.hidden;
    setDoraVisible(!vis);
  };
})();
if (window.anime && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  anime({ targets: '.app-icon', translateY: [18, 0], scale: [.96, 1], delay: anime.stagger(45), duration: 700, easing: 'easeOutCubic' });
  anime({ targets: '.ambient', scale: [.92, 1.08], opacity: [.72, 1], borderRadius: ['50%', '44%'], delay: anime.stagger(220), duration: 4200, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-one', translateX: ['-2vw', '2vw'], translateY: ['-1vh', '2vh'], rotate: [-2, 3], duration: 9000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-two', translateX: ['2vw', '-2vw'], translateY: ['2vh', '-1vh'], rotate: [3, -4], duration: 11000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-three', translateX: ['-3vw', '3vw'], translateY: ['2vh', '-2vh'], scale: [.9, 1.12], duration: 5000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-four', translateX: ['3vw', '-2vw'], translateY: ['-2vh', '2vh'], rotate: [-6, 4], duration: 8000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-five', translateX: ['-2vw', '2vw'], translateY: ['1vh', '-3vh'], scale: [.8, 1.15], duration: 4500, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-six', translateX: ['-3vw', '3vw'], translateY: ['2vh', '-2vh'], scale: [.92, 1.08], duration: 9000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-seven', translateX: ['2vw', '-3vw'], translateY: ['-2vh', '2vh'], rotate: [2, -5], duration: 6000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-eight', translateX: ['-2vw', '2vw'], translateY: ['-2vh', '1vh'], scale: [1.08, .9], duration: 7000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  anime({ targets: '.ambient-nine', translateX: ['1vw', '4vw'], translateY: ['2vh', '-2vh'], duration: 5000, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
}
