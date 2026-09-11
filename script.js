// dock - make every button do something
const win = document.getElementById('window');

function showApp(name, text) {
  win.innerHTML = '<strong>' + name + '</strong><br>' + text + '<br><br><button onclick="document.getElementById(&quot;window&quot;).classList.remove(&quot;show&quot;)" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.12);color:white;cursor:pointer">Close</button>';
  win.classList.add('show');
}

document.querySelectorAll('.dock button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const app = btn.dataset.app;

    if (app === 'browser') return window.open('https://example.com', '_blank', 'noopener');
    if (app === 'instagram') return window.open('https://instagram.com', '_blank', 'noopener');
    if (app === 'whatsapp') return window.open('https://web.whatsapp.com', '_blank', 'noopener');
    if (app === 'youtube') return window.open('https://youtube.com', '_blank', 'noopener');
    if (app === 'files') return showApp('Files', 'Your files would appear here.');
    if (app === 'paint') return showApp('Paint', 'Canvas would open here.');
    if (app === 'terminal') return showApp('Terminal', 'orbit $ _');
    if (app === 'calculator') return showApp('Calculator', '0');

    win.textContent = app;
    win.classList.add('show');
  });
});

// click outside to close, but not when clicking dock
document.addEventListener('click', e => {
  if (!e.target.closest('.dock') && !e.target.closest('#window')) {
    win.classList.remove('show');
  }
});
