# Designer Toolkit

A Chrome extension for designers and developers that provides essential tools for inspecting and working with visual elements on any webpage.

## Features

### Color Picker
Pick any color from the screen using the EyeDropper API. Colors are saved to a history and displayed in multiple formats:
- HEX
- RGB
- HSL
- OKLCH

Configurable auto-copy on pick and customizable default copy format.

### Font Inspector
Click on any text element to capture its typography properties:
- Font family
- Font size
- Font weight
- Font style
- Line height
- Color

### WCAG Contrast Checker
Check color contrast ratios for accessibility compliance. Enter or pick foreground and background colors to see:
- Contrast ratio
- WCAG AA pass/fail status
- WCAG AAA pass/fail status

### Styles Grabber
Select any element on a page to extract its computed CSS properties.

## Settings

- Light and dark theme support
- Configurable color copy format (HEX, RGB, HSL, OKLCH)
- Auto-copy toggle
- Adjustable history limit (10, 25, or 50 items)

## Installation

Install from the [Chrome Web Store](https://chromewebstore.google.com/).

## Permissions

- **storage**: Save color/font history and user preferences
- **activeTab**: Access the current tab for color picking and element inspection
- **scripting**: Inject content scripts for font and style grabbing

## Author

Made by [Andreas Katzmann](https://x.com/AndreasKatzmann)
