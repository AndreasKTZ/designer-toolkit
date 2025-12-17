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
/**
 * Machado et al. (2009)
 * Severity ≈ 1.0 (full deficiency)
 * Color space: LINEAR RGB
 * Format: 4x5 color matrix
 */

const COLOR_MATRICES = {
  // ===== DICHROMACY (complete absence) =====
  // Protanopia - Red-blind (~1% of males)
  protanopia: [
    0.152286, 1.052583, -0.204868, 0, 0,
    0.114503, 0.786281,  0.099216, 0, 0,
   -0.003882, -0.048116, 1.051998, 0, 0,
    0, 0, 0, 1, 0
  ],

  // Deuteranopia - Green-blind (~1% of males)
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0, 0,
    0.280085, 0.672501,  0.047413, 0, 0,
   -0.011820, 0.042940,  0.968881, 0, 0,
    0, 0, 0, 1, 0
  ],

  // Tritanopia - Blue-blind (rare, ~0.003%)
  tritanopia: [
    1.255528, -0.076749, -0.178779, 0, 0,
   -0.078411, 0.930809,  0.147602, 0, 0,
    0.004733, 0.691367,  0.303900, 0, 0,
    0, 0, 0, 1, 0
  ],

  // ===== ANOMALOUS TRICHROMACY (partial/weak) =====
  // Protanomaly - Red-weak (~1% of males)
  protanomaly: [
    0.458064, 0.679578, -0.137642, 0, 0,
    0.092785, 0.846313,  0.060902, 0, 0,
   -0.007494, -0.016807, 1.024301, 0, 0,
    0, 0, 0, 1, 0
  ],

  // Deuteranomaly - Green-weak (most common, ~5% of males)
  deuteranomaly: [
    0.547494, 0.607765, -0.155259, 0, 0,
    0.181692, 0.781742,  0.036566, 0, 0,
   -0.010410, 0.027275,  0.983136, 0, 0,
    0, 0, 0, 1, 0
  ],

  // Tritanomaly - Blue-weak (rare)
  tritanomaly: [
    1.017277, 0.027029, -0.044306, 0, 0,
   -0.006113, 0.958479,  0.047634, 0, 0,
    0.006379, 0.248708,  0.744913, 0, 0,
    0, 0, 0, 1, 0
  ],

  // ===== MONOCHROMACY =====
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
