// Content script for font picking
(function () {
    // Prevent multiple injections
    if (window.__dtFontPickerActive) return;
    window.__dtFontPickerActive = true;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'dt-font-picker-overlay';
    document.body.appendChild(overlay);

    // Create highlight box
    const highlight = document.createElement('div');
    highlight.className = 'dt-font-picker-highlight';
    document.body.appendChild(highlight);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'dt-font-picker-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    let currentElement = null;

    function updateHighlight(element) {
        if (!element || element === overlay || element === highlight || element === tooltip) {
            highlight.style.display = 'none';
            tooltip.style.display = 'none';
            return;
        }

        const rect = element.getBoundingClientRect();
        highlight.style.display = 'block';
        highlight.style.top = rect.top + window.scrollY + 'px';
        highlight.style.left = rect.left + window.scrollX + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';

        // Get font info for tooltip
        const styles = window.getComputedStyle(element);
        const fontFamily = styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        const fontSize = styles.fontSize;
        const fontWeight = styles.fontWeight;

        tooltip.textContent = `${fontFamily} • ${fontSize} • ${fontWeight}`;
        tooltip.style.display = 'block';

        // Position tooltip
        let tooltipX = rect.left;
        let tooltipY = rect.top - 40;

        if (tooltipY < 10) {
            tooltipY = rect.bottom + 10;
        }
        if (tooltipX + 200 > window.innerWidth) {
            tooltipX = window.innerWidth - 210;
        }

        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
    }

    function handleMouseMove(e) {
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);

        // Skip our own elements
        if (elementBelow === overlay || elementBelow === highlight || elementBelow === tooltip) {
            overlay.style.pointerEvents = 'none';
            const realElement = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.pointerEvents = 'auto';
            currentElement = realElement;
        } else {
            currentElement = elementBelow;
        }

        updateHighlight(currentElement);
    }

    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();

        if (currentElement && currentElement !== overlay) {
            const styles = window.getComputedStyle(currentElement);

            const fontData = {
                fontFamily: styles.fontFamily,
                fontSize: styles.fontSize,
                fontWeight: styles.fontWeight,
                fontStyle: styles.fontStyle,
                lineHeight: styles.lineHeight,
                letterSpacing: styles.letterSpacing,
                color: styles.color,
                timestamp: Date.now()
            };

            // Send to background
            chrome.runtime.sendMessage({ action: 'fontPicked', fontData: fontData });
        }

        cleanup();
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            cleanup();
        }
    }

    function cleanup() {
        overlay.remove();
        highlight.remove();
        tooltip.remove();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown);
        window.__dtFontPickerActive = false;
    }

    // Event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);
})();
