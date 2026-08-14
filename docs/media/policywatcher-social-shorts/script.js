(() => {
  const params = new URLSearchParams(window.location.search);
  const recordMode = params.get('record') === '1';
  const shortStage = document.querySelector('.short-stage');
  const artboard = document.querySelector('.artboard');

  function setShortScale() {
    if (!shortStage || !artboard) return;
    const availableWidth = shortStage.clientWidth;
    const availableHeight = shortStage.clientHeight;
    const scale = Math.min(availableWidth / 1080, availableHeight / 1920);
    artboard.style.setProperty('--art-scale', String(Math.max(scale, 0.05)));
  }

  function setPaused(paused) {
    if (!shortStage) return;
    shortStage.classList.toggle('is-paused', paused);
    const pauseButton = document.querySelector('[data-action="pause"]');
    if (pauseButton) {
      pauseButton.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
      pauseButton.setAttribute('title', paused ? 'Play animation' : 'Pause animation');
      pauseButton.classList.toggle('is-paused', paused);
    }
  }

  function restartShort() {
    if (!shortStage) return;
    setPaused(false);
    shortStage.classList.remove('is-running');
    void shortStage.offsetWidth;
    shortStage.classList.add('is-running');
  }

  if (shortStage && artboard) {
    shortStage.classList.add('is-running');
    setShortScale();
    window.addEventListener('resize', setShortScale);
    if ('ResizeObserver' in window) new ResizeObserver(setShortScale).observe(shortStage);

    if (recordMode) document.body.classList.add('record-mode');

    document.querySelector('[data-action="pause"]')?.addEventListener('click', () => {
      setPaused(!shortStage.classList.contains('is-paused'));
    });
    document.querySelector('[data-action="restart"]')?.addEventListener('click', restartShort);
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (!event.data || event.data.scope !== 'policywatcher-short') return;
      if (event.data.action === 'pause') setPaused(true);
      if (event.data.action === 'play') setPaused(false);
      if (event.data.action === 'restart') restartShort();
    });
  }

  const shortFrame = document.getElementById('shortFrame');
  if (!shortFrame) return;

  const clipButtons = Array.from(document.querySelectorAll('.clip-button'));
  const activeClipLabel = document.getElementById('activeClipLabel');
  const openShort = document.getElementById('openShort');
  const pausePreview = document.getElementById('pausePreview');
  const restartPreview = document.getElementById('restartPreview');
  const cyclePreview = document.getElementById('cyclePreview');
  const clips = [
    ['short-01-source-to-evidence.html', '01 / Source to evidence'],
    ['short-02-adaptive-workspace.html', '02 / Adaptive Workspace'],
    ['short-03-public-boundaries.html', '03 / Public boundaries'],
  ];
  let activeClip = 0;
  let previewPaused = false;
  let cycleTimer = null;

  function messageShort(action) {
    const targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
    shortFrame.contentWindow?.postMessage({ scope: 'policywatcher-short', action }, targetOrigin);
  }

  function renderActiveClip(index) {
    activeClip = (index + clips.length) % clips.length;
    const [file, label] = clips[activeClip];
    clipButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeClip;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    activeClipLabel.textContent = label;
    openShort.href = `${file}?record=1`;
    previewPaused = false;
    pausePreview.classList.remove('is-paused');
    pausePreview.setAttribute('aria-label', 'Pause preview');
    pausePreview.title = 'Pause preview';
    shortFrame.src = `${file}?record=1&clip=${activeClip}`;
  }

  function setCycling(enabled) {
    window.clearInterval(cycleTimer);
    cycleTimer = null;
    cyclePreview.setAttribute('aria-pressed', String(enabled));
    cyclePreview.classList.toggle('is-active', enabled);
    if (enabled) cycleTimer = window.setInterval(() => renderActiveClip(activeClip + 1), 22000);
  }

  clipButtons.forEach((button) => {
    button.addEventListener('click', () => renderActiveClip(Number(button.dataset.index)));
  });
  pausePreview.addEventListener('click', () => {
    previewPaused = !previewPaused;
    messageShort(previewPaused ? 'pause' : 'play');
    pausePreview.classList.toggle('is-paused', previewPaused);
    pausePreview.setAttribute('aria-label', previewPaused ? 'Play preview' : 'Pause preview');
    pausePreview.title = previewPaused ? 'Play preview' : 'Pause preview';
  });
  restartPreview.addEventListener('click', () => messageShort('restart'));
  cyclePreview.addEventListener('click', () => setCycling(cycleTimer === null));
  shortFrame.addEventListener('load', () => {
    if (previewPaused) messageShort('pause');
  });
})();
