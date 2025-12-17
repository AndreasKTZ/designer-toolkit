// Background service worker for Designer Toolkit

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pickFont') {
        handlePickFont();
    } else if (message.action === 'fontPicked') {
        handleFontPicked(message.fontData);
    } else if (message.action === 'grabStyles') {
        handleGrabStyles();
    } else if (message.action === 'stylesResult') {
        handleStylesResult(message.styles);
    }
});

async function handlePickFont() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            console.error('No active tab found');
            return;
        }

        // Inject the font picker content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/content.js']
        });

        // Also inject styles for the overlay
        await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            css: `
                .dt-font-picker-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 2147483647;
                    cursor: crosshair;
                }
                .dt-font-picker-highlight {
                    position: absolute;
                    background: rgba(59, 130, 246, 0.2);
                    border: 2px solid rgb(59, 130, 246);
                    border-radius: 4px;
                    pointer-events: none;
                    z-index: 2147483646;
                    transition: all 0.1s ease;
                }
                .dt-font-picker-tooltip {
                    position: fixed;
                    background: #1a1a1a;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 12px;
                    z-index: 2147483647;
                    pointer-events: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
            `
        });
    } catch (err) {
        console.error('Error injecting font picker:', err);
    }
}

async function handleFontPicked(fontData) {
    // Save font to storage
    const result = await chrome.storage.local.get(['fontHistory']);
    const fonts = result.fontHistory || [];

    fontData.id = Date.now().toString();
    fonts.unshift(fontData);

    if (fonts.length > 10) {
        fonts.pop();
    }

    await chrome.storage.local.set({ fontHistory: fonts });
}

async function handleGrabStyles() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            console.error('No active tab found');
            return;
        }

        // Inject the styles grabber content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/styles.js']
        });
    } catch (err) {
        console.error('Error injecting styles grabber:', err);
    }
}

async function handleStylesResult(styles) {
    // Store the grabbed styles temporarily
    await chrome.storage.local.set({ lastGrabbedStyles: styles });
}
