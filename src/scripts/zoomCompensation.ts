(function () {

  function isMobileDevice(): boolean {
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.screen.width <= 1024 || window.innerWidth <= 1024;
    const hasTouchAndSmallScreen = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) && isSmallScreen;
    const isLikelyMobileHighDPR = window.devicePixelRatio > 1 && isSmallScreen &&
      Math.abs(window.innerWidth - window.screen.width) < 100;
    return isMobileUA || hasTouchAndSmallScreen || isLikelyMobileHighDPR;
  }

  function applyZoomFix() {
    const wrapper = document.getElementById('zoom-wrapper');
    if (!wrapper) return;

    if (isMobileDevice()) {
      wrapper.style.transform = 'none';
      wrapper.style.width = '';
      wrapper.style.height = '';
      wrapper.style.transformOrigin = '';
      return;
    }

    wrapper.style.transform = '';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';

    const dpr = window.devicePixelRatio || 1;
    if (dpr <= 1.01) return;

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
