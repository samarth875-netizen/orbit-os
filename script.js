const win = document.getElementById('window');
let files = JSON.parse(localStorage.getItem('orbit-files') || 'null') || [
  {name:'ideas.txt', content:'Collect the ideas that deserve a little more orbit.'},
  {name:'orbit.config', content:'theme=light'}
];

function header(title) {
  return `<div class="head"><span>${title}</span><button class="close" onclick="document.getElementById('window').classList.remove('show')">×</button></div>`;
}

function show(html) {
  win.innerHTML = html;
  win.classList.add('show');
}

function openFiles() {
  function render() {
    const rows = files.map((f,i)=> `<div class="file-row"><button data-i="${i}">${f.name}</button><span style="opacity:0.6;font-size:11px">TEXT</span></div>`).join('');
    show(header('Files') + `<button class="close" style="margin-bottom:10px" id="newFile">+ New file</button><div>${rows || 'No files'}</div>`);
    win.querySelectorAll('[data-i]').forEach(b=> b.onclick = () => {
      const f = files[b.dataset.i];
      const v = prompt('Edit ' + f.name, f.content);
      if (v !== null) { f.content = v; localStorage.setItem('orbit-files', JSON.stringify(files)); render(); }
    });
    document.getElementById('newFile').onclick = () => {
      const n = prompt('New file name', 'untitled.txt');
      if (!n) return;
      files.push({name:n, content:''});
      localStorage.setItem('orbit-files', JSON.stringify(files));
      render();
    };
  }
  render();
}

function openPaint() {
  show(header('Paint') + `<div class="tools"><label>Color <input type="color" id="col" value="#ff5500"></label><label>Size <input type="range" id="sz" min="2" max="24" value="6"></label><button id="clear">Clear</button><button id="save">Save</button></div><canvas id="cv" width="340" height="220"></canvas>`);
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  const col = document.getElementById('col'), sz = document.getElementById('sz');
  let drawing = false;
  function pos(e) {
    const r = cv.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return [x * cv.width / r.width, y * cv.height / r.height];
  }
  cv.addEventListener('pointerdown', e => { drawing=true; cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); });
  cv.addEventListener('pointermove', e => {
    if (!drawing) return;
    ctx.strokeStyle = col.value; ctx.lineWidth = sz.value; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.lineTo(...pos(e)); ctx.stroke();
  });
  window.addEventListener('pointerup', () => drawing=false);
  document.getElementById('clear').onclick = () => ctx.clearRect(0,0,cv.width,cv.height);
  document.getElementById('save').onclick = () => { const a=document.createElement('a'); a.download='paint.png'; a.href=cv.toDataURL(); a.click(); };
}

function openTerminal() {
  show(header('Terminal') + `<div class="terminal"><div id="out"><div>Orbit Terminal — type help</div></div><div style="display:flex;gap:6px;margin-top:8px"><span>$</span><input id="in" autocomplete="off" placeholder="help, clear, date"></div></div>`);
  const inp = document.getElementById('in'), out = document.getElementById('out');
  function print(t){ out.insertAdjacentHTML('beforeend','<div>'+t+'</div>'); out.scrollTop=out.scrollHeight; }
  inp.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const cmd = inp.value.trim().toLowerCase(); inp.value='';
    print('<span style="opacity:0.6">$ '+cmd+'</span>');
    if (cmd==='clear') out.innerHTML='';
    else if (cmd==='help') print('help, clear, date, echo');
    else if (cmd==='date') print(new Date().toString());
    else if (cmd.startsWith('echo ')) print(cmd.slice(5));
    else if (cmd) print('not found: '+cmd);
  });
  setTimeout(()=> inp.focus(), 50);
}

document.querySelectorAll('.dock button').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const a = btn.dataset.app;
    if (a==='browser') return window.open('https://example.com','_blank','noopener');
    if (a==='instagram') return window.open('https://instagram.com','_blank','noopener');
    if (a==='whatsapp') return window.open('https://web.whatsapp.com','_blank','noopener');
    if (a==='youtube') return window.open('https://youtube.com','_blank','noopener');
    if (a==='files') return openFiles();
    if (a==='paint') return openPaint();
    if (a==='terminal') return openTerminal();
    if (a==='calculator') return show(header('Calculator')+'<div style="text-align:center;padding:20px;opacity:0.7">Calculator — coming soon</div>');
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('.dock') && !e.target.closest('#window')) win.classList.remove('show');
});
