// Content script for grabbing element styles
(function () {
    if (window.__styleGrabberActive) return;
    window.__styleGrabberActive = true;

    let overlay = null;
    let tooltip = null;

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'style-grabber-overlay';
        overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 4px;
      z-index: 2147483647;
      transition: all 0.1s ease;
    `;
        document.body.appendChild(overlay);

        tooltip = document.createElement('div');
        tooltip.id = 'style-grabber-tooltip';
        tooltip.style.cssText = `
      position: fixed;
      padding: 6px 10px;
      background: #1a1a1a;
      color: #ffffff;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-radius: 4px;
      z-index: 2147483648;
      pointer-events: none;
      white-space: nowrap;
    `;
        document.body.appendChild(tooltip);
    }

    function updateOverlay(element) {
        const rect = element.getBoundingClientRect();
        overlay.style.top = rect.top + 'px';
        overlay.style.left = rect.left + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';

        const tagName = element.tagName.toLowerCase();
        const className = element.className ? '.' + element.className.split(' ')[0] : '';
        tooltip.textContent = `<${tagName}${className}>`;
        tooltip.style.top = (rect.top - 30) + 'px';
        tooltip.style.left = rect.left + 'px';
    }

    function getRelevantStyles(element) {
        const computed = window.getComputedStyle(element);
        const relevant = [
            'display', 'position', 'width', 'height', 'margin', 'padding',
            'background-color', 'color', 'font-family', 'font-size', 'font-weight',
            'line-height', 'text-align', 'border', 'border-radius', 'box-shadow',
            'opacity', 'z-index', 'overflow', 'flex-direction', 'justify-content',
            'align-items', 'gap'
        ];

        const styles = {};
        relevant.forEach(prop => {
            const value = computed.getPropertyValue(prop);
            if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px') {
                styles[prop] = value;
            }
        });
        return styles;
    }

    function handleMouseMove(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && element !== overlay && element !== tooltip) {
            updateOverlay(element);
        }
    }

    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && element !== overlay && element !== tooltip) {
            const styles = getRelevantStyles(element);
            chrome.runtime.sendMessage({ action: 'stylesResult', styles });
        }

        cleanup();
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cleanup();
        }
    }

    function cleanup() {
        window.__styleGrabberActive = false;
        overlay?.remove();
        tooltip?.remove();
        document.removeEventListener('mousemove', handleMouseMove, true);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.body.style.cursor = '';
    }

    createOverlay();
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
})();
