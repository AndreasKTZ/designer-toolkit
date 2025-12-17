// ============================================
// Designer Toolkit - Popup Script
// ============================================

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

// Color Panel Elements
const pickColorBtn = document.getElementById('pickColorBtn');
const clearColorHistoryBtn = document.getElementById('clearColorHistoryBtn');
const colorHistoryList = document.getElementById('colorHistoryList');

// Font Panel Elements
const pickFontBtn = document.getElementById('pickFontBtn');
const clearFontHistoryBtn = document.getElementById('clearFontHistoryBtn');
const fontHistoryList = document.getElementById('fontHistoryList');

// Settings Elements
const themeButtons = document.querySelectorAll('.toggle-btn[data-theme]');
const autoCopyButtons = document.querySelectorAll('.toggle-btn[data-autocopy]');
const defaultColorFormatSelect = document.getElementById('defaultColorFormat');
const historyLimitSelect = document.getElementById('historyLimit');


// Simulate Panel Elements
const simButtons = document.querySelectorAll('.sim-btn');
const resetSimulationBtn = document.getElementById('resetSimulation');
const currentSimDisplay = document.getElementById('currentSim');

// Config
let historyLimit = 10;
let defaultColorFormat = 'hex';
let autoCopy = false;

// ============================================
// Theme & Settings
// ============================================

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  chrome.storage.local.set({ theme: theme });
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function setAutoCopy(enabled) {
  autoCopy = enabled;
  chrome.storage.local.set({ autoCopy: enabled });
  autoCopyButtons.forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.autocopy === 'true') === enabled);
  });
}

themeButtons.forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});

autoCopyButtons.forEach(btn => {
  btn.addEventListener('click', () => setAutoCopy(btn.dataset.autocopy === 'true'));
});

defaultColorFormatSelect?.addEventListener('change', (e) => {
  defaultColorFormat = e.target.value;
  chrome.storage.local.set({ defaultColorFormat: defaultColorFormat });
});

historyLimitSelect?.addEventListener('change', (e) => {
  historyLimit = parseInt(e.target.value);
  chrome.storage.local.set({ historyLimit: historyLimit });
});

// ============================================
// Tab Switching
// ============================================

function switchTab(tabName) {
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `${tabName}-panel`);
  });
  chrome.storage.local.set({ activeTab: tabName });
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});


// ============================================
// Color Picker Functions
// ============================================

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

function rgbToOklch(r, g, b) {
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return {
    l: Math.round(L * 100 * 100) / 100,
    c: Math.round(C * 100) / 100,
    h: Math.round(H * 100) / 100
  };
}

function formatRgb(rgb) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function formatOklch(oklch) {
  return `oklch(${oklch.l}% ${oklch.c} ${oklch.h})`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function formatHsl(hsl) {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

// ============================================
// Clipboard & Copy Button
// ============================================

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add('copied');
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>`;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

function createCopyButton(value, title) {
  return `<button class="copy-btn" data-value="${value}" title="${title}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  </button>`;
}

// ============================================
// Color Card
// ============================================

function getColorValue(color, format) {
  const rgb = hexToRgb(color.hex);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  switch (format) {
    case 'rgb': return formatRgb(rgb);
    case 'oklch': return formatOklch(oklch);
    case 'hsl': return formatHsl(hsl);
    default: return color.hex;
  }
}

function createColorCard(color) {
  const rgb = hexToRgb(color.hex);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const card = document.createElement('div');
  card.className = 'color-card';
  card.innerHTML = `
    <div class="color-card-header">
      <div class="color-swatch" style="background-color: ${color.hex}"></div>
      <span class="color-hex">${color.hex}</span>
      <button class="copy-btn quick-copy" data-hex="${color.hex}" title="Copy (${defaultColorFormat.toUpperCase()})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      <button class="delete-btn" title="Remove color">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div class="color-details">
      <div class="color-value-row">
        <span class="color-label">HEX</span>
        <span class="color-value">${color.hex}</span>
        ${createCopyButton(color.hex, 'Copy HEX')}
      </div>
      <div class="color-value-row">
        <span class="color-label">RGB</span>
        <span class="color-value">${formatRgb(rgb)}</span>
        ${createCopyButton(formatRgb(rgb), 'Copy RGB')}
      </div>
      <div class="color-value-row">
        <span class="color-label">HSL</span>
        <span class="color-value">${formatHsl(hsl)}</span>
        ${createCopyButton(formatHsl(hsl), 'Copy HSL')}
      </div>
      <div class="color-value-row">
        <span class="color-label">OKLCH</span>
        <span class="color-value">${formatOklch(oklch)}</span>
        ${createCopyButton(formatOklch(oklch), 'Copy OKLCH')}
      </div>
    </div>
  `;

  setupCardEvents(card, 'color', color.hex);
  return card;
}

// ============================================
// Font Card
// ============================================

function createFontCard(font) {
  const card = document.createElement('div');
  card.className = 'font-card';

  card.innerHTML = `
    <div class="font-card-header">
      <div class="font-name">${font.fontFamily.split(',')[0].replace(/['"]/g, '')}</div>
      <button class="delete-btn" title="Remove font">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div class="font-details">
      <div class="font-value-row">
        <span class="font-label">Family</span>
        <span class="font-value">${font.fontFamily}</span>
        ${createCopyButton(font.fontFamily, 'Copy font-family')}
      </div>
      <div class="font-value-row">
        <span class="font-label">Size</span>
        <span class="font-value">${font.fontSize}</span>
        ${createCopyButton(font.fontSize, 'Copy font-size')}
      </div>
      <div class="font-value-row">
        <span class="font-label">Weight</span>
        <span class="font-value">${font.fontWeight}</span>
        ${createCopyButton(font.fontWeight, 'Copy font-weight')}
      </div>
      <div class="font-value-row">
        <span class="font-label">Style</span>
        <span class="font-value">${font.fontStyle}</span>
        ${createCopyButton(font.fontStyle, 'Copy font-style')}
      </div>
      <div class="font-value-row">
        <span class="font-label">Line Height</span>
        <span class="font-value">${font.lineHeight}</span>
        ${createCopyButton(font.lineHeight, 'Copy line-height')}
      </div>
      <div class="font-value-row">
        <span class="font-label">Color</span>
        <span class="font-value">${font.color}</span>
        ${createCopyButton(font.color, 'Copy color')}
      </div>
    </div>
  `;

  setupCardEvents(card, 'font', font.id);
  return card;
}

// ============================================
// Card Event Setup
// ============================================

function setupCardEvents(card, type, id) {
  const header = card.querySelector(`.${type}-card-header`);
  const deleteBtn = card.querySelector('.delete-btn');
  const quickCopyBtn = card.querySelector('.quick-copy');

  header.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn') || e.target.closest('.copy-btn')) return;
    card.classList.toggle('expanded');
  });

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (type === 'color') {
      await removeColor(id);
    } else {
      await removeFont(id);
    }
  });

  // Quick copy button (uses default format)
  if (quickCopyBtn && type === 'color') {
    quickCopyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const hex = quickCopyBtn.dataset.hex;
      const value = getColorValue({ hex }, defaultColorFormat);
      copyToClipboard(value, quickCopyBtn);
    });
  }

  // Regular copy buttons in details
  const copyButtons = card.querySelectorAll('.copy-btn:not(.quick-copy)');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(btn.dataset.value, btn);
    });
  });
}

// ============================================
// Color History
// ============================================

function renderColorHistory(colors) {
  if (colors.length === 0) {
    colorHistoryList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"/>
          <path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"/>
          <path d="M 7 17h.01"/>
        </svg>
        <p>No colors yet</p>
        <span>Click "Pick Color" to get started</span>
      </div>
    `;
    clearColorHistoryBtn.disabled = true;
  } else {
    colorHistoryList.innerHTML = '';
    colors.forEach(color => {
      colorHistoryList.appendChild(createColorCard(color));
    });
    clearColorHistoryBtn.disabled = false;
  }
}

async function loadColors() {
  const result = await chrome.storage.local.get(['colorHistory']);
  return result.colorHistory || [];
}

async function saveColors(colors) {
  await chrome.storage.local.set({ colorHistory: colors });
}

async function addColor(hex) {
  const colors = await loadColors();
  const existingIndex = colors.findIndex(c => c.hex.toLowerCase() === hex.toLowerCase());
  if (existingIndex !== -1) {
    colors.splice(existingIndex, 1);
  }
  colors.unshift({ hex: hex.toUpperCase(), timestamp: Date.now() });
  while (colors.length > historyLimit) colors.pop();
  await saveColors(colors);
  renderColorHistory(colors);
  return hex.toUpperCase();
}

async function removeColor(hex) {
  const colors = await loadColors();
  const filtered = colors.filter(c => c.hex.toLowerCase() !== hex.toLowerCase());
  await saveColors(filtered);
  renderColorHistory(filtered);
}

async function clearColorHistory() {
  await saveColors([]);
  renderColorHistory([]);
}

async function pickColor() {
  if (!('EyeDropper' in window)) {
    alert('EyeDropper API is not supported in this browser.');
    return;
  }
  try {
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();
    const hex = await addColor(result.sRGBHex);
    if (autoCopy) {
      const value = getColorValue({ hex }, defaultColorFormat);
      await navigator.clipboard.writeText(value);
    }
  } catch (err) {
    console.log('Color picking cancelled');
  }
}

// ============================================
// Font History
// ============================================

function renderFontHistory(fonts) {
  if (fonts.length === 0) {
    fontHistoryList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        <p>No fonts yet</p>
        <span>Click "Pick Font" to inspect text</span>
      </div>
    `;
    clearFontHistoryBtn.disabled = true;
  } else {
    fontHistoryList.innerHTML = '';
    fonts.forEach(font => {
      fontHistoryList.appendChild(createFontCard(font));
    });
    clearFontHistoryBtn.disabled = false;
  }
}

async function loadFonts() {
  const result = await chrome.storage.local.get(['fontHistory']);
  return result.fontHistory || [];
}

async function saveFonts(fonts) {
  await chrome.storage.local.set({ fontHistory: fonts });
}

async function addFont(fontData) {
  const fonts = await loadFonts();
  fontData.id = Date.now().toString();
  fonts.unshift(fontData);
  while (fonts.length > historyLimit) fonts.pop();
  await saveFonts(fonts);
  renderFontHistory(fonts);
}

async function removeFont(id) {
  const fonts = await loadFonts();
  const filtered = fonts.filter(f => f.id !== id);
  await saveFonts(filtered);
  renderFontHistory(filtered);
}

async function clearFontHistory() {
  await saveFonts([]);
  renderFontHistory([]);
}

async function pickFont() {
  // Tell background to inject font picker, then close popup
  chrome.runtime.sendMessage({ action: 'pickFont' });
  window.close();
}

// ============================================
// WCAG Contrast Checker
// ============================================

const wcagBgInput = document.getElementById('wcagBgInput');
const wcagFgInput = document.getElementById('wcagFgInput');
const wcagBgColor = document.getElementById('wcagBgColor');
const wcagFgColor = document.getElementById('wcagFgColor');
const wcagPreview = document.getElementById('wcagPreview');
const wcagRatio = document.getElementById('wcagRatio');
const wcagAA = document.getElementById('wcagAA');
const wcagAAA = document.getElementById('wcagAAA');

function getLuminance(r, g, b) {
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(bg, fg) {
  const bgRgb = hexToRgb(bg);
  const fgRgb = hexToRgb(fg);
  if (!bgRgb || !fgRgb) return null;

  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);

  const lighter = Math.max(bgLum, fgLum);
  const darker = Math.min(bgLum, fgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

function updateWcagDisplay() {
  const bg = wcagBgInput?.value || '#FFFFFF';
  const fg = wcagFgInput?.value || '#000000';

  const ratio = getContrastRatio(bg, fg);

  if (ratio !== null && wcagPreview) {
    // Update preview
    wcagPreview.style.background = bg;
    const sampleText = wcagPreview.querySelector('.wcag-sample-text');
    if (sampleText) sampleText.style.color = fg;

    // Update ratio display
    if (wcagRatio) wcagRatio.textContent = ratio.toFixed(2) + ':1';

    // Update badges
    const passAA = ratio >= 4.5;
    const passAAA = ratio >= 7;

    if (wcagAA) {
      wcagAA.className = 'wcag-badge ' + (passAA ? 'pass' : 'fail');
      wcagAA.querySelector('.wcag-badge-status').textContent = passAA ? 'Pass' : 'Fail';
    }
    if (wcagAAA) {
      wcagAAA.className = 'wcag-badge ' + (passAAA ? 'pass' : 'fail');
      wcagAAA.querySelector('.wcag-badge-status').textContent = passAAA ? 'Pass' : 'Fail';
    }
  }
}

wcagBgInput?.addEventListener('input', updateWcagDisplay);
wcagFgInput?.addEventListener('input', updateWcagDisplay);

// Color picker inputs
wcagBgColor?.addEventListener('input', (e) => {
  wcagBgInput.value = e.target.value.toUpperCase();
  updateWcagDisplay();
});

wcagFgColor?.addEventListener('input', (e) => {
  wcagFgInput.value = e.target.value.toUpperCase();
  updateWcagDisplay();
});

// ============================================
// Styles Grabber
// ============================================

const grabStylesBtn = document.getElementById('grabStylesBtn');
const stylesOutput = document.getElementById('stylesOutput');

function displayStyles(styles) {
  if (!stylesOutput) return;

  const cssText = Object.entries(styles)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join('\n');

  stylesOutput.innerHTML = `
    <div class="styles-code-block">
      <div class="styles-code-header">
        <span class="styles-code-title">CSS</span>
        <button class="copy-btn" id="copyStylesBtn" title="Copy CSS">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <div class="styles-code-content">${cssText}</div>
    </div>
  `;

  document.getElementById('copyStylesBtn')?.addEventListener('click', (e) => {
    copyToClipboard(cssText, e.target.closest('.copy-btn'));
  });
}

grabStylesBtn?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'grabStyles' });
  window.close();
});

// Listen for grabbed styles from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'stylesGrabbed' && message.styles) {
    displayStyles(message.styles);
  }
});

// ============================================
// Color Blindness Simulation
// ============================================

const SIMULATION_LABELS = {
  normal: 'Normal',
  deuteranopia: 'Deuteranopia',
  protanopia: 'Protanopia',
  tritanopia: 'Tritanopia',
  achromatopsia: 'Achromatopsia'
};

let currentSimulation = 'normal';

function updateSimulationUI(type) {
  currentSimulation = type;

  // Update button states
  simButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Update status display
  if (currentSimDisplay) {
    const label = SIMULATION_LABELS[type] || 'Normal';
    currentSimDisplay.innerHTML = `Currently viewing: <strong>${label}</strong>`;
  }
}

async function applySimulation(type) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      console.error('No active tab found');
      return;
    }

    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-colorblind.js']
    });

    // Small delay to ensure script is loaded
    await new Promise(resolve => setTimeout(resolve, 50));

    // Send message to apply the filter
    await chrome.tabs.sendMessage(tab.id, {
      action: 'applyColorBlindness',
      type: type
    });

    // Store the current simulation state
    await chrome.storage.local.set({ currentSimulation: type });

    updateSimulationUI(type);
  } catch (err) {
    console.error('Failed to apply simulation:', err);
  }
}

async function removeSimulation() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      console.error('No active tab found');
      return;
    }

    // Try to send remove message (script might already be injected)
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'removeColorBlindness'
      });
    } catch (e) {
      // Script not injected, which is fine - nothing to remove
    }

    // Clear stored state
    await chrome.storage.local.set({ currentSimulation: 'normal' });

    updateSimulationUI('normal');
  } catch (err) {
    console.error('Failed to remove simulation:', err);
  }
}

// Simulation button event listeners
simButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (currentSimulation === type) {
      // Clicking active button turns it off
      removeSimulation();
    } else {
      applySimulation(type);
    }
  });
});

resetSimulationBtn?.addEventListener('click', removeSimulation);

// ============================================
// Event Listeners
// ============================================

pickColorBtn.addEventListener('click', pickColor);
clearColorHistoryBtn.addEventListener('click', clearColorHistory);
pickFontBtn.addEventListener('click', pickFont);
clearFontHistoryBtn.addEventListener('click', clearFontHistory);

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Restore theme
  const { theme } = await chrome.storage.local.get(['theme']);
  if (theme) {
    setTheme(theme);
  }

  // Restore default color format
  const { defaultColorFormat: savedFormat } = await chrome.storage.local.get(['defaultColorFormat']);
  if (savedFormat) {
    defaultColorFormat = savedFormat;
    if (defaultColorFormatSelect) {
      defaultColorFormatSelect.value = savedFormat;
    }
  }

  // Restore auto-copy setting
  const { autoCopy: savedAutoCopy } = await chrome.storage.local.get(['autoCopy']);
  if (savedAutoCopy !== undefined) {
    setAutoCopy(savedAutoCopy);
  } else {
    setAutoCopy(false); // default off
  }

  // Restore history limit
  const { historyLimit: savedLimit } = await chrome.storage.local.get(['historyLimit']);
  if (savedLimit) {
    historyLimit = savedLimit;
    if (historyLimitSelect) {
      historyLimitSelect.value = savedLimit;
    }
  }

  // Restore active tab
  const { activeTab } = await chrome.storage.local.get(['activeTab']);
  if (activeTab) {
    // Handle legacy tab names
    let mappedTab = activeTab;
    if (activeTab === 'wcag') mappedTab = 'contrast';
    if (activeTab === 'simulate' || activeTab === 'a11y') mappedTab = 'colorblind';
    switchTab(mappedTab);
  }

  // Load histories
  const colors = await loadColors();
  renderColorHistory(colors);

  const fonts = await loadFonts();
  renderFontHistory(fonts);

  // Load grabbed styles if any
  const { lastGrabbedStyles } = await chrome.storage.local.get(['lastGrabbedStyles']);
  if (lastGrabbedStyles && Object.keys(lastGrabbedStyles).length > 0) {
    displayStyles(lastGrabbedStyles);
  }

  // Initialize WCAG display
  updateWcagDisplay();

  // Restore simulation state
  const { currentSimulation: savedSimulation } = await chrome.storage.local.get(['currentSimulation']);
  if (savedSimulation && savedSimulation !== 'normal') {
    updateSimulationUI(savedSimulation);
  }
});
