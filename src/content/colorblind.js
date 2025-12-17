// ============================================
// Designer Toolkit - Color Blindness Simulator
// Content Script for injecting SVG filters
// ============================================

(function() {
  // Prevent multiple injections
  if (window.__dtColorBlindActive) return;
  window.__dtColorBlindActive = true;

  // Color transformation matrices based on scientific research
  // Source: Machado, Oliveira, Fernandes (2009)
  // "A Physiologically-based Model for Simulation of Color Vision Deficiency"
  const COLOR_MATRICES = {
    // ===== ANOMALOUS TRICHROMACY (partial/weak) =====
    // Protanomaly - Red-weak (~1% of males)
    protanomaly: [
      0.817, 0.183, 0, 0, 0,
      0.333, 0.667, 0, 0, 0,
      0, 0.125, 0.875, 0, 0,
      0, 0, 0, 1, 0
    ],
    // Deuteranomaly - Green-weak (most common, ~5% of males)
    deuteranomaly: [
      0.8, 0.2, 0, 0, 0,
      0.258, 0.742, 0, 0, 0,
      0, 0.142, 0.858, 0, 0,
      0, 0, 0, 1, 0
    ],
    // Tritanomaly - Blue-weak (rare)
    tritanomaly: [
      0.967, 0.033, 0, 0, 0,
      0, 0.733, 0.267, 0, 0,
      0, 0.183, 0.817, 0, 0,
      0, 0, 0, 1, 0
    ],

    // ===== DICHROMACY (complete absence) =====
    // Protanopia - Red-blind (~1% of males)
    protanopia: [
      0.567, 0.433, 0, 0, 0,
      0.558, 0.442, 0, 0, 0,
      0, 0.242, 0.758, 0, 0,
      0, 0, 0, 1, 0
    ],
    // Deuteranopia - Green-blind (~1% of males)
    deuteranopia: [
      0.625, 0.375, 0, 0, 0,
      0.7, 0.3, 0, 0, 0,
      0, 0.3, 0.7, 0, 0,
      0, 0, 0, 1, 0
    ],
    // Tritanopia - Blue-blind (rare, ~0.003%)
    tritanopia: [
      0.95, 0.05, 0, 0, 0,
      0, 0.433, 0.567, 0, 0,
      0, 0.475, 0.525, 0, 0,
      0, 0, 0, 1, 0
    ],

    // ===== MONOCHROMACY (no color) =====
    // Achromatopsia - Complete color blindness (rod monochromacy)
    achromatopsia: [
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0.299, 0.587, 0.114, 0, 0,
      0, 0, 0, 1, 0
    ],
    // Achromatomaly - Partial monochromacy (blue cone monochromacy)
    achromatomaly: [
      0.618, 0.320, 0.062, 0, 0,
      0.163, 0.775, 0.062, 0, 0,
      0.163, 0.320, 0.516, 0, 0,
      0, 0, 0, 1, 0
    ]
  };

  const SVG_ID = '__dt-colorblind-svg';
  const FILTER_ID = '__dt-colorblind-filter';

  function applyColorBlindFilter(type) {
    // Remove any existing filter first
    removeColorBlindFilter();

    const matrix = COLOR_MATRICES[type];
    if (!matrix) return false;

    // Create SVG element with filter
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.id = SVG_ID;
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';

    // Create the filter with color matrix
    svg.innerHTML = `
      <defs>
        <filter id="${FILTER_ID}" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="${matrix.join(' ')}" />
        </filter>
      </defs>
    `;

    document.body.appendChild(svg);

    // Apply filter to the entire page
    document.documentElement.style.filter = `url(#${FILTER_ID})`;
    document.documentElement.style.setProperty('-webkit-filter', `url(#${FILTER_ID})`);

    return true;
  }

  function removeColorBlindFilter() {
    // Remove SVG element
    const svg = document.getElementById(SVG_ID);
    if (svg) {
      svg.remove();
    }

    // Remove filter from html element
    document.documentElement.style.filter = '';
    document.documentElement.style.removeProperty('-webkit-filter');
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'applyColorBlindness') {
      const success = applyColorBlindFilter(message.type);
      sendResponse({ success, type: message.type });
    } else if (message.action === 'removeColorBlindness') {
      removeColorBlindFilter();
      sendResponse({ success: true });
    } else if (message.action === 'getColorBlindStatus') {
      const svg = document.getElementById(SVG_ID);
      sendResponse({ active: !!svg });
    }
    return true; // Keep message channel open for async response
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    window.__dtColorBlindActive = false;
  });
})();
