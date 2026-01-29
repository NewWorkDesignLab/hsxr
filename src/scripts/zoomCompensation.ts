(function () {
  function applyZoomFix() {
    const wrapper = document.getElementById('zoom-wrapper');
    if (!wrapper) return;

    const dpr = window.devicePixelRatio || 1;

    wrapper.style.transform = '';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';

    if (dpr <= 1.01) {
      return;
    }

    const scale = 1 / dpr;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaledWidth = viewportWidth * dpr;
    const scaledHeight = viewportHeight * dpr;

    wrapper.style.transformOrigin = '0 0';
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.width = `${scaledWidth}px`;
    wrapper.style.height = `${scaledHeight}px`;

    console.log(
      `Zoom-Fix: DPR=${dpr}, Scale=${scale}, Viewport=${viewportWidth}x${viewportHeight}, Wrapper=${scaledWidth}x${scaledHeight}`
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

  const mqList = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  mqList.addEventListener('change', applyZoomFix);
})();
