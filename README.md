# Autofill — Chrome Extension for Job Applications

Review-first Chrome extension for quickly filling common job-application forms.

## Features

- Save a reusable application profile with Chrome Storage Sync.
- Fill common fields by matching labels, names, IDs, placeholders, and accessibility metadata.
- React-safe input updates using the native value setter and DOM events.
- Support for text inputs, textareas, selects, radio buttons, and checkboxes.
- MutationObserver support for dynamically rendered application forms.
- Cross-frame fill support for embedded application forms.
- Targeted content-script matches for LinkedIn, Jobright, Greenhouse, Lever, Workday, and Ashby.
- Manual review before submission.
- AI cover-letter button placeholder for future development.
- No automatic form submission.

## Tech Stack

- Manifest V3
- Vanilla JavaScript
- Chrome Storage API
- Chrome Scripting API
- MutationObserver
- CSS with automatic light/dark theme support

## Installation

1. Open chrome://extensions/ in Chrome or brave://extensions/ in Brave.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the project directory.
5. Open the extension popup.
6. Enter your profile and click Save.

## How it works

Popup → chrome.storage.sync → content script → DOM

1. The popup saves the profile in Chrome Sync storage.
2. Fill Form sends FILL_FORM to the current tab's main frame with chrome.tabs.sendMessage.
3. The popup also uses chrome.scripting.executeScript with allFrames: true to trigger filling inside embedded frames.
4. The content script maps page controls to profile fields using FIELD_MAP.
5. React-safe native setters and input/change/blur events update controlled form elements.
6. MutationObserver watches for newly rendered controls for a short window after Fill Form.
7. The user reviews the completed form and submits it manually.

## Supported Sites

Initial host and content-script matches cover:

- LinkedIn
- Jobright
- Greenhouse
- Lever
- Workday
- Ashby

A particular application can still require manual entry when it uses custom widgets, unusual markup, cross-origin restrictions, or CAPTCHA.

## Roadmap

- AI-powered cover-letter generation.
- Support for more job boards and ATS platforms.
- Automatic ATS-platform detection.
- Better custom combobox and autocomplete support.
- Field confidence scoring and review summaries.
- Optional per-site profiles.

## Privacy

This MVP has no external backend or analytics service. Profile data is stored through the Chrome extension storage API.

Do not store passwords, session tokens, API keys, or other secrets in the profile.

## Scope

This project intentionally does not auto-submit applications, solve CAPTCHAs, or invent screening answers.
