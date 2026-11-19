(() => {
  const video = document.getElementById('teaser-video');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!reducedMotion.matches) {
    video.play().catch(() => { /* Native controls are available if autoplay is blocked. */ });
  }

  reducedMotion.addEventListener('change', event => {
    if (event.matches) video.pause();
  });
})();
