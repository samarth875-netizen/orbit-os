// simple dock - no extra features
const win = document.getElementById('window');

document.querySelectorAll('.dock button').forEach(btn => {
  btn.addEventListener('click', () => {
    const app = btn.dataset.app;

    // browser apps open externally
    if (app === 'browser') return window.open('https://example.com', '_blank');
    if (app === 'instagram') return window.open('https://instagram.com', '_blank');
    if (app === 'whatsapp') return window.open('https://web.whatsapp.com', '_blank');
    if (app === 'youtube') return window.open('https://youtube.com', '_blank');

    // local apps show a tiny placeholder
    win.textContent = app + ' app';
    win.classList.add('show');
    setTimeout(() => win.classList.remove('show'), 1600);
  });
});

// hide window on click outside
window.addEventListener('click', e => {
  if (!e.target.closest('.dock')) win.classList.remove('show');
});
