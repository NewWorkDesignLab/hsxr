(function () {

  function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || ('ontouchstart' in window)
      || (navigator.maxTouchPoints > 0);
  }

  function applyZoomFix() {
    const wrapper = document.getElementById('zoom-wrapper');
    if (!wrapper) return;

    wrapper.style.transform = '';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';

    if (isMobileDevice()) {
      console.log('Zoom-Fix: Mobile device detected, skipping zoom compensation');
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    if (dpr <= 1.01) {
      console.log('Zoom-Fix: No OS zoom detected (DPR=1)');
      return;
    }

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scale = 1 / dpr;

    const scaledWidth = viewportWidth * dpr;
    const scaledHeight = viewportHeight * dpr;

    wrapper.style.transformOrigin = '0 0';
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.width = `${scaledWidth}px`;
    wrapper.style.height = `${scaledHeight}px`;

    document.documentElement.style.setProperty('--zoom-scale', String(dpr));
    document.documentElement.style.setProperty('--effective-viewport-width', `${scaledWidth}px`);
    document.documentElement.style.setProperty('--effective-viewport-height', `${scaledHeight}px`);

    console.log(
      `Zoom-Fix: DPR=${dpr.toFixed(2)}, Scale=${scale.toFixed(4)}, ` +
      `Screen=${screenWidth}x${screenHeight}, Viewport=${viewportWidth}x${viewportHeight}, ` +
      `Wrapper=${scaledWidth}x${scaledHeight}`
    );
  }

  applyZoomFix();

  document.addEventListener('DOMContentLoaded', applyZoomFix);
  window.addEventListener('load', applyZoomFix);

  let timer: number | undefined;
  window.addEventListener('resize', () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(applyZoomFix, 50);
  });

  let currentDpr = window.devicePixelRatio;
  const checkDprChange = () => {
    if (window.devicePixelRatio !== currentDpr) {
      currentDpr = window.devicePixelRatio;
      applyZoomFix();
    }
  };

  const mqList = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  mqList.addEventListener('change', () => {
    checkDprChange();
    applyZoomFix();
  });

  setInterval(checkDprChange, 1000);
})();
